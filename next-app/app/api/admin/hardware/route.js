import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// Initialize global hardware state containers across Next.js API re-evaluations
if (!global._hardwareProcesses) {
  global._hardwareProcesses = {};
}
if (!global._hardwareLogs) {
  global._hardwareLogs = {
    read_tags_entry: [],
    read_tags_exit: [],
    image_capture: [],
  };
}

const SCRIPT_MAP = {
  read_tags_entry: "read_tags_entry.py",
  read_tags_exit: "read_tags_exit.py",
  image_capture: "image_capture.py",
};

const getScriptPath = (scriptKey) => {
  const fileName = SCRIPT_MAP[scriptKey];
  if (!fileName) return null;
  return path.join(process.cwd(), "..", "hardware", fileName);
};

const appendLog = (scriptKey, message, type = "info") => {
  if (!global._hardwareLogs[scriptKey]) {
    global._hardwareLogs[scriptKey] = [];
  }
  const timestamp = new Date().toLocaleTimeString();
  const logObj = { timestamp, message, type };
  global._hardwareLogs[scriptKey].push(logObj);
  // Keep last 100 log lines max
  if (global._hardwareLogs[scriptKey].length > 100) {
    global._hardwareLogs[scriptKey].shift();
  }
};

export async function GET(req) {
  try {
    const scriptsStatus = {};
    for (const key of Object.keys(SCRIPT_MAP)) {
      const proc = global._hardwareProcesses[key];
      const isRunning = proc && !proc.killed && proc.pid !== undefined;
      scriptsStatus[key] = {
        running: Boolean(isRunning),
        pid: isRunning ? proc.pid : null,
        logs: global._hardwareLogs[key] || [],
      };
    }

    return NextResponse.json({ success: true, scripts: scriptsStatus });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { script, action } = await req.json();

    if (!SCRIPT_MAP[script]) {
      return NextResponse.json(
        { success: false, message: `Invalid script key: ${script}` },
        { status: 400 }
      );
    }

    const scriptPath = getScriptPath(script);

    if (action === "clear_logs") {
      global._hardwareLogs[script] = [];
      return NextResponse.json({ success: true, message: "Logs cleared" });
    }

    if (action === "start") {
      // Check if already running
      const existingProc = global._hardwareProcesses[script];
      if (existingProc && !existingProc.killed) {
        return NextResponse.json(
          { success: false, message: `Script ${script} is already running (PID: ${existingProc.pid})` },
          { status: 400 }
        );
      }

      if (!fs.existsSync(scriptPath)) {
        appendLog(script, `Script file not found: ${scriptPath}`, "error");
        return NextResponse.json(
          { success: false, message: `Script file not found at ${scriptPath}` },
          { status: 404 }
        );
      }

      // Try launching with python3 or python
      const pythonCmd = process.platform === "win32" ? "python" : "python3";
      appendLog(script, `Launching ${SCRIPT_MAP[script]} using ${pythonCmd}...`, "info");

      const child = spawn(pythonCmd, [scriptPath], {
        cwd: path.dirname(scriptPath),
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
      });

      global._hardwareProcesses[script] = child;
      appendLog(script, `Process started successfully (PID: ${child.pid})`, "success");

      child.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        lines.forEach((line) => {
          if (line.trim()) appendLog(script, line.trim(), "stdout");
        });
      });

      child.stderr.on("data", (data) => {
        const lines = data.toString().split("\n");
        lines.forEach((line) => {
          if (line.trim()) appendLog(script, line.trim(), "stderr");
        });
      });

      child.on("close", (code) => {
        appendLog(script, `Process terminated with exit code ${code}`, code === 0 ? "info" : "warning");
        delete global._hardwareProcesses[script];
      });

      child.on("error", (err) => {
        appendLog(script, `Failed to start process: ${err.message}`, "error");
        delete global._hardwareProcesses[script];
      });

      return NextResponse.json({
        success: true,
        message: `Started ${script} (PID: ${child.pid})`,
        pid: child.pid,
      });
    }

    if (action === "stop") {
      const proc = global._hardwareProcesses[script];
      if (!proc) {
        return NextResponse.json(
          { success: false, message: `Script ${script} is not running` },
          { status: 400 }
        );
      }

      appendLog(script, `Sending stop signal to PID ${proc.pid}...`, "warning");

      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", proc.pid.toString(), "/f", "/t"]);
      } else {
        proc.kill("SIGTERM");
      }

      delete global._hardwareProcesses[script];
      appendLog(script, "Process stopped", "info");

      return NextResponse.json({
        success: true,
        message: `Stopped ${script}`,
      });
    }

    return NextResponse.json(
      { success: false, message: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
