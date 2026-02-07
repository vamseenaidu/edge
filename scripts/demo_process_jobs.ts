import { processAll } from "../edge/api/runtime/jobs/processor";

const DEFAULT_SIGNAL = (process.env.EDGE_DEMO_PROCESS_SIGNAL ?? "SIGUSR2") as NodeJS.Signals;

async function runProcessAll(trigger: string): Promise<void> {
  console.log(`Processing queued jobs (trigger=${trigger})`);
  await processAll();
  console.log("Queued jobs processed");
}

async function waitForCompletion(baseUrl: string, jobId: string): Promise<void> {
  for (let i = 0; i < 50; i += 1) {
    const response = await fetch(`${baseUrl}/api/v1/jobs/${jobId}`);
    if (response.ok) {
      const payload = (await response.json()) as {
        data?: { job?: { status?: string } };
      };
      const status = payload?.data?.job?.status;
      if (status === "completed") {
        console.log(`JOB_ID=${jobId} reached status=completed`);
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Timed out waiting for JOB_ID=${jobId} to become completed`);
}

async function main(): Promise<void> {
  const serverPidRaw = process.env.SERVER_PID;
  const jobId = process.env.JOB_ID;
  const baseUrl = process.env.BASE_URL;

  if (serverPidRaw) {
    const serverPid = Number(serverPidRaw);
    if (!Number.isInteger(serverPid) || serverPid <= 0) {
      throw new Error(`Invalid SERVER_PID=${serverPidRaw}`);
    }
    process.kill(serverPid, DEFAULT_SIGNAL);
    console.log(`Signaled server pid=${serverPid} with ${DEFAULT_SIGNAL}`);
  } else {
    await runProcessAll("standalone");
  }

  if (jobId && baseUrl) {
    await waitForCompletion(baseUrl, jobId);
  }
}

if (process.env.EDGE_DEMO_PROCESS_HOOK === "1") {
  process.on(DEFAULT_SIGNAL, () => {
    runProcessAll(DEFAULT_SIGNAL).catch((error) => {
      console.error(error);
    });
  });
  console.log(`Job processor hook armed on signal ${DEFAULT_SIGNAL}`);
} else {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
