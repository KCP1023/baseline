import { Injectable } from "@nestjs/common";

@Injectable()
export class CircuitInputsParserService {

  public async applyMappingToJSONPayload(payload: string, cim: CircuitInputsMapping) {
    const result: any = {};

    cim.mapping.forEach(mapping => {
        const value = this.getJsonValueByPath(payload, mapping.payloadJsonPath);

        switch (mapping.dataType) {
        case "string":
            result[mapping.circuitInput] = value ?? mapping.defaultValue;
            break;
        case "integer":
            result[mapping.circuitInput] = value ?? mapping.defaultValue;
            break;
        case "array":
            if (mapping.arrayType === "integer") {
                result[mapping.circuitInput] = value ?? mapping.defaultValue;
            }
            break;
        default:
            result[mapping.circuitInput] = value;
        }
    });

    return result;
  }

  private getJsonValueByPath(json: any, path: string) {
    const parts = path.split('.');
    let currentValue = json;
  
    for (const part of parts) {
      if (currentValue[part] === undefined) {
        return undefined;
      }
      currentValue = currentValue[part];
    }
  
    return currentValue;
  };
}