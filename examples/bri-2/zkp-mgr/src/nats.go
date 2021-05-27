package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/joho/godotenv"
	nats "github.com/nats-io/nats.go"
	"github.com/pborman/uuid"
)

type circuitCompileMsg struct {
	WorkflowId   string
	Identities   []string
	ZkCircuitDoc ZKCircuit
}

type circuitSetupMsg struct {
	WorkflowId  string
	ZkCircuitId string
}

type verifierCompileMsg struct {
	WorkflowId  string
	ZkCircuitId string
}

type contractsDeployMsg struct {
	WorkflowId  string
	ZkCircuitId string
}

func InitNats() *nats.Conn {
	// Get NATS_URL from .env
	godotenv.Load(".env")
	natsUrl := os.Getenv("NATS_URL")

	// Connect to NATS server
	nc, err := nats.Connect(
		natsUrl,
		nats.Name("Demo connection name"),
		nats.Timeout(10*time.Second),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			// handle disconnect error event
			fmt.Println("Error: nats disconnected")
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			// handle reconnect event
			fmt.Println("Success: nats reconnected")
		}),
		nats.ReconnectWait(3*time.Second))

	if err != nil {
		log.Fatal(err)
	}

	// Subscribe to subjects processed by zkp-mgr
	nc.Subscribe("circuit-compile", func(m *nats.Msg) {
		log.Println("NATS circuit-compile: received new request")
		var msgData circuitCompileMsg
		var zkCircuitDoc ZKCircuit
		var workflowUpdates = make(map[string]string)
		var err error

		json.Unmarshal(m.Data, &msgData)
		log.Println("NATS circuit-compile: processing request for workflowId ", msgData.WorkflowId)

		circuitId := uuid.NewRandom().String()
		zkCircuitDoc.ID = circuitId
		zkCircuitDoc.Name = "signature circuit"
		zkCircuitDoc.Status = "created"
		zkCircuitDoc.CurveID = ecc.BN254 // default curveId is BN256 for now
		os.Mkdir("src/circuits/"+circuitId+"/", 0755)
		generateSignatureCircuit(circuitId, msgData.Identities)

		// Save zkCircuit status as "created"
		collection := dbClient.Database(dbName).Collection(zkCircuitCollection)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

		_, err = collection.InsertOne(ctx, zkCircuitDoc)
		cancel()
		if err != nil {
			// Save workflow status: fail-circuit-compile
			workflowUpdates["status"] = "fail-circuit-compile"
			updateWorkflow(msgData.WorkflowId, workflowUpdates)
			return
		}

		// Compile circuit
		err = compileCircuit(circuitId)
		if err != nil {
			// Save workflow status: fail-circuit-compile
			workflowUpdates["status"] = "fail-circuit-compile"
			updateWorkflow(msgData.WorkflowId, workflowUpdates)
			return
		}

		// Save workflow status: success-circuit-compile
		// PUT /workflows/{id}
		workflowUpdates["status"] = "success-circuit-compile"
		workflowUpdates["zkCircuitId"] = circuitId
		updateWorkflow(msgData.WorkflowId, workflowUpdates)

		// Create new "circuit-setup" job
		log.Println("NATS circuit-compile: completed request for workflowId ", msgData.WorkflowId)
		var setupMsg circuitSetupMsg
		setupMsg.WorkflowId = msgData.WorkflowId
		setupMsg.ZkCircuitId = circuitId
		encodedSetupMsg, _ := json.Marshal(setupMsg)
		nc.Publish("circuit-setup", encodedSetupMsg)
	})

	nc.Subscribe("circuit-setup", func(m *nats.Msg) {
		log.Println("NATS circuit-setup: received new request")
		var msgData circuitSetupMsg
		var workflowUpdates = make(map[string]string)
		var err error

		json.Unmarshal(m.Data, &msgData)
		log.Println("NATS circuit-setup: processing request for workflowId", msgData.WorkflowId)

		err = setupCircuit(msgData.ZkCircuitId)
		if err != nil {
			// Save workflow status: fail-circuit-compile
			workflowUpdates["status"] = "fail-circuit-setup"
			updateWorkflow(msgData.WorkflowId, workflowUpdates)
			return
		}

		// Save workflow status: success-circuit-setup
		workflowUpdates["status"] = "success-circuit-setup"
		updateWorkflow(msgData.WorkflowId, workflowUpdates)

		// Create new "contracts-compile-verifier" job
		var compileMsg verifierCompileMsg
		compileMsg.WorkflowId = msgData.WorkflowId
		compileMsg.ZkCircuitId = msgData.ZkCircuitId
		encodedCompileMsg, _ := json.Marshal(compileMsg)
		log.Println("NATS circuit-setup: completed job. Adding job to contracts-compile-verifier queue for workflowId", msgData.WorkflowId)
		nc.Publish("contracts-compile-verifier", encodedCompileMsg)
	})

	return nc
}

// Makes a request to PUT /workflows/{id}
// Updates "status" and sometimes sets "zkCircuitId" for the given workflowId
func updateWorkflow(workflowId string, updates map[string]string) error {
	var err error
	godotenv.Load(".env")
	workflowMgrUrl := os.Getenv("WORKFLOW_MGR_URL")

	client := &http.Client{Timeout: time.Second * 10}
	requestUrl := workflowMgrUrl + "/workflows/" + workflowId

	// Encode the data
	putBody, err := json.Marshal(updates)
	if err != nil {
		log.Println("Error converting string map to json:", err.Error())
	}

	encodedPutBody := bytes.NewBuffer(putBody)
	req, _ := http.NewRequest(http.MethodPut, requestUrl, encodedPutBody)
	req.Header.Add("Content-Type", "application/json")
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		log.Println("Error updating workflow: PUT /workflows returned status code" + fmt.Sprint(res.StatusCode))
		httpError := errors.New("PUT /workflows returned status code" + fmt.Sprint(res.StatusCode))
		return httpError
	}
	return nil
}
