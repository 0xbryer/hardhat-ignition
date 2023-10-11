import {
  DeploymentCompleteEvent,
  DeploymentResultType,
  ExecutionErrorDeploymentResult,
  ExecutionEventType,
  PreviousRunErrorDeploymentResult,
  ReconciliationErrorDeploymentResult,
  ValidationErrorDeploymentResult,
} from "@nomicfoundation/ignition-core";
import { assert } from "chai";
import chalk from "chalk";

import { calculateDeploymentCompleteDisplay } from "../../../src/ui/helpers/calculate-deployment-complete-display";

describe("ui - calculate deployment complete display", () => {
  const exampleAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
  const differentAddress = "0x0011223344556677889900112233445566778899";

  describe("successful deployment", () => {
    it("should render a sucessful deployment", () => {
      const expectedText = testFormat(`

        [ MyModule ] successfully deployed 🚀

        ${chalk.bold("Deployed Addresses")}

        MyModule#Token - 0x1F98431c8aD98523631AE4a59f267346ea31F984
        MyModule#AnotherToken - 0x0011223344556677889900112233445566778899`);

      const event: DeploymentCompleteEvent = {
        type: ExecutionEventType.DEPLOYMENT_COMPLETE,
        result: {
          type: DeploymentResultType.SUCCESSFUL_DEPLOYMENT,
          contracts: {
            "MyModule#Token": {
              id: "MyModule#Token",
              address: exampleAddress,
              contractName: "Token",
            },
            "MyModule#AnotherToken": {
              id: "MyModule#AnotherToken",
              address: differentAddress,
              contractName: "AnotherToken",
            },
          },
        },
      };

      const actualText = calculateDeploymentCompleteDisplay(event, {
        moduleName: "MyModule",
      });

      assert.equal(actualText, expectedText);
    });

    it("should render a sucessful deployment with no contracts", () => {
      const expectedText = testFormat(`

        [ MyModule ] successfully deployed 🚀

        ${chalk.bold("Deployed Addresses")}

        ${chalk.italic("No contracts were deployed")}`);

      const event: DeploymentCompleteEvent = {
        type: ExecutionEventType.DEPLOYMENT_COMPLETE,
        result: {
          type: DeploymentResultType.SUCCESSFUL_DEPLOYMENT,
          contracts: {},
        },
      };

      const actualText = calculateDeploymentCompleteDisplay(event, {
        moduleName: "MyModule",
      });

      assert.equal(actualText, expectedText);
    });
  });

  describe("validation failures", () => {
    it("should render multiple validation errors on multiple futures", () => {
      const expectedText = testFormat(`

        [ MyModule ] validation failed ⛔

        MyModule:MyContract errors:
         - The number of params does not match the constructor
         - The name of the contract is invalid

        MyModule:AnotherContract errors:
         - No library provided`);

      const result: ValidationErrorDeploymentResult = {
        type: DeploymentResultType.VALIDATION_ERROR,
        errors: {
          "MyModule:MyContract": [
            "The number of params does not match the constructor",
            "The name of the contract is invalid",
          ],
          "MyModule:AnotherContract": ["No library provided"],
        },
      };

      const event: DeploymentCompleteEvent = {
        type: ExecutionEventType.DEPLOYMENT_COMPLETE,
        result,
      };

      const actualText = calculateDeploymentCompleteDisplay(event, {
        moduleName: "MyModule",
      });

      assert.equal(actualText, expectedText);
    });
  });

  describe("reconciliation errors", () => {
    it("should render a multiple reconciliation errors on multiple futures", () => {
      const expectedText = testFormat(`

        [ MyModule ] reconciliation failed ⛔

        MyModule:MyContract errors:
         - The params don't match
         - The value doesn't match

        MyModule:AnotherContract errors:
         - The artifact bytecode has changed`);

      const result: ReconciliationErrorDeploymentResult = {
        type: DeploymentResultType.RECONCILIATION_ERROR,
        errors: {
          "MyModule:MyContract": [
            "The params don't match",
            "The value doesn't match",
          ],
          "MyModule:AnotherContract": ["The artifact bytecode has changed"],
        },
      };

      const event: DeploymentCompleteEvent = {
        type: ExecutionEventType.DEPLOYMENT_COMPLETE,
        result,
      };

      const actualText = calculateDeploymentCompleteDisplay(event, {
        moduleName: "MyModule",
      });

      assert.equal(actualText, expectedText);
    });
  });

  describe("previous run errors", () => {
    it("should render a multiple previous run errors on multiple futures", () => {
      const expectedText = testFormat(`

        [ MyModule ] deployment cancelled ⛔

        These futures failed or timed out on a previous run:
         - MyModule:MyContract
         - MyModule:AnotherContract

        Use the ${chalk.italic("wipe")} task to reset them.
        Check out the docs to learn more: <LINK>`);

      const result: PreviousRunErrorDeploymentResult = {
        type: DeploymentResultType.PREVIOUS_RUN_ERROR,
        errors: {
          "MyModule:MyContract": ["The previous run failed"],
          "MyModule:AnotherContract": ["The previous run timed out"],
        },
      };

      const event: DeploymentCompleteEvent = {
        type: ExecutionEventType.DEPLOYMENT_COMPLETE,
        result,
      };

      const actualText = calculateDeploymentCompleteDisplay(event, {
        moduleName: "MyModule",
      });

      assert.equal(actualText, expectedText);
    });
  });

  describe("execution errors", () => {
    it("should render an execution failure with multiple of each problem type", () => {
      const expectedText = testFormat(`

        [ MyModule ] failed ⛔

        Transaction remains unconfirmed after fee bump:
         - MyModule:MyContract1
         - MyModule:AnotherContract1

        Consider increasing the fee in your config.
        Check out the docs to learn more: <LINK>

        Failures:
         - MyModule:MyContract3/1: Reverted with reason x
         - MyModule:AnotherContract3/3: Reverted with reason y

        Held:
         - MyModule:MyContract2/1: Vote is not complete
         - MyModule:AnotherContract2/3: Server timed out`);

      const result: ExecutionErrorDeploymentResult = {
        type: DeploymentResultType.EXECUTION_ERROR,
        started: [],
        timedOut: [
          { futureId: "MyModule:MyContract1", networkInteractionId: 1 },
          { futureId: "MyModule:AnotherContract1", networkInteractionId: 3 },
        ],
        held: [
          {
            futureId: "MyModule:MyContract2",
            heldId: 1,
            reason: "Vote is not complete",
          },
          {
            futureId: "MyModule:AnotherContract2",
            heldId: 3,
            reason: "Server timed out",
          },
        ],
        failed: [
          {
            futureId: "MyModule:MyContract3",
            networkInteractionId: 1,
            error: "Reverted with reason x",
          },
          {
            futureId: "MyModule:AnotherContract3",
            networkInteractionId: 3,
            error: "Reverted with reason y",
          },
        ],
        successful: [],
      };

      const event: DeploymentCompleteEvent = {
        type: ExecutionEventType.DEPLOYMENT_COMPLETE,
        result,
      };

      const actualText = calculateDeploymentCompleteDisplay(event, {
        moduleName: "MyModule",
      });

      assert.equal(actualText, expectedText);
    });
  });
});

function testFormat(expected: string): string {
  return expected
    .toString()
    .substring(1) // Remove the first newline
    .split("\n")
    .map((line) => line.substring(8)) // remove prefix whitespace
    .join("\n");
}
