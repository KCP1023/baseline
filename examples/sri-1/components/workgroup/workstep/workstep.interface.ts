import { Privacy } from '../policy/privacy';
import { Security } from '../policy/security';
import { Agreement } from '../storage/agreement';

export interface IWorkstep {
    name: string;
    id: string; //[R217] A workstep MUST have a unique identifier within a BPI.
    workgroupId: string; //[R215] A workstep instance MUST be associated with only one workgroup.
    version: string; //[R220] A workstep MUST be versioned within a BPI.
    status: string; //[R219] A workstep instance MUST NOT be updated while the workstep is being executed by the BPI.
    businessLogicToExecute: any; //[R211] A workstep MUST have an input, one or more process steps, and an output.This is just a well-known convention from business process management frameworks.
    securityPolicy: Security[]; //[R216] A workstep instance MUST inherit the security and privacy policies of its associated workgroup.
    privacyPolicy: Privacy[]; //[R216] A workstep instance MUST inherit the security and privacy policies of its associated workgroup.
    setBusinessLogicToExecute(businessLogicToExecute: any) //[R218] A workstep MUST be updatable.
    execute(currentState: Agreement, stateChangeObject: any): string 
    //[R211] A workstep MUST have an input, one or more process steps, and an output.This is just a well-known convention from business process management frameworks.
    //[R212] The input of a workstep MUST represent a new, proposed state of a state object compliant with the agreement between the agreement counterparties 
    //[R221] A workstep MUST be executed by a BPI.
    //[R223] A workstep MUST be deterministic. 
}

/**
//? Implemented as business rules encoded in zkp circuit
[R213]The process steps in a workstep MUST represent a verification system comprised of the set, or subset, of agreement rules and agreement data such that an input can be validated to comply with the agreement rules and agreement data, or not.

//? Implemented as output of business rules encoded in zkp circuit, but included as necessary output on the workstep level
[R214] The output of a workstep MUST represent the verifiable validation result of an input into a workstep as a correct or incorrect new agreement state.
New Agreement State = Old Agreement State + Agreed upon New State Object + Workstep Output 

//? Should one be able to update more than the execution logic?
[R218] A workstep MUST be updatable.

//? Must check that member is authorized member of workgroup attached to workstep
[R222] The input of a workstep MUST be submitted by an authorized member of the workgroup attached to that workstep.

//? Must require output from workstep agreed upon through quorum signatures of workgroup participants - here? workflow level? workgroup level?
[R224]
The output from a workstep execution MUST be finalized through an agreed-upon quorum of cryptographic signatures of the workgroup participants associated with the workstep.
This means that the output of a workstep execution must be verified and agreed upon by a previously defined number of the workgroup participants. This naturally extends to the input as well.

//!Needs ZKP component for implementation
[R225]
The output from a workstep execution MUST be a valid zero-knowledge proof of correctness of the input generated by the BPI executing the workstep (privacy preservation).
A Zero-Knowledge Proof is defined as having to satisfy the following three properties:
Completeness: if the statement is true, an honest verifier, i.e., an entity following the protocol properly, will be convinced of this fact by an honest prover.
Soundness: if the statement is false, no cheating prover can convince an honest verifier that it is true, except with some small probability.
Zero-Knowledge: if the statement is true, no verifier learns anything other than the fact that the statement is true. In other words, just knowing the statement (not the secret) is sufficient to construct a scenario that shows that the prover knows the secret. This is formalized by showing that every verifier has some simulator that, given only the statement to be proved (and no access to the prover), can produce a transcript that "looks like" an interaction between the honest prover and the verifier.

//!Needs ZKP component for implementation
[R226]
A zero-knowledge proof of correctness of an input MUST be non-interactive.

//!Needs ZKP component for implementation
[R227]
An input that does not represent a new, valid agreement state of a state object MUST NOT generate a valid zero-knowledge proof of correctness of the input.

//!Needs ZKP component for implementation
[R228]
A zero-knowledge proof of correctness of an input MUST be verifiable by any 3rd party in a time at most proportional to the size of the prover system that generated the proof.
The time requirement means that any 3rd party verifier must be able to verify the proof representing a prover system of size n in time O(n), e.g., a Merkle-proof of a Merkle-trie branch of 10 tuples can be verified in 10 computational steps. It also means that the zero-knowledge proof of correctness of input does not have to be succinct. Succinct means that the proofs are short (smaller than the size of the prover circuit) and that the verification is fast.

//!Needs ZKP component for implementation
//? Needs to have trigger on workstep/workflow/workgroup level that causes this? 
[R229]
A zero-knowledge proof of correctness of an input into a workstep MUST be committed to the CCSM utilized by the BPI using a compact cryptographic proof after it has been finalized on the BPI.
Such a commitment can represent more than one zero-knowledge proof of correctness of an input. Compact in this context means that the CCSM commitment is smaller in size than the totality of the proof(s) represented by the commitment. This is desirable because it reduces the data footprint of the BPI which should be one of the implementation goals of a BPI.

//!Needs ZKP component for implementation
[R230]
A cryptographic proof of correctness of a BPI state transition on the CCSM MUST be verifiable by any 3rd party at any time in a time at most proportional to the size of the prover system.
Note, that the requirement does not state that the proof has to be verifiable on the CCSM itself, that it does not need to be succinct, and that it does not need to be efficient. */