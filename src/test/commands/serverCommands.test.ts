import * as assert from "assert";
import { ServerStatusService } from "../../services/ServerStatusService";
import { Shell } from "../../utils/Shell";

class MockShell extends Shell {
  public async runPythonScript(scriptPath: string, args: string[] = []): Promise<string> {
    const simulatedOutput = JSON.stringify({
      is_connected: true,
      host: "http://127.0.0.1",
      port: 8237,
      storeType: "MockStoreType",
      storeUrl: "MockStoreUrl",
    });
    return simulatedOutput;
  }
}


suite("Server Status Service Test Suite", () => {
  test("ServerStatusService correctly fetches server status", async () => {
    const mockShell = new MockShell();
    const serverStatusService = ServerStatusService.getInstance(mockShell);
    await serverStatusService.updateStatus();
    const serverStatus = serverStatusService.getCurrentStatus();

    assert.strictEqual(
      serverStatus.isConnected,
      true,
      "Server should be reported as connected"
    );
    assert.strictEqual(
      serverStatus.host,
      "http://127.0.0.1",
      "Server host does not match expected value"
    );
    assert.strictEqual(
      serverStatus.port,
      8237,
      "Server port does not match expected value"
    );
  });
});