import { getExcelPassword } from "./password";
export type WorkbookDecryptor = (data: ArrayBuffer) => Promise<ArrayBuffer>;
// CPU-intensive Office key derivation runs off the UI thread and stays on-device.
export const decryptWorkbook: WorkbookDecryptor = (data) =>
  new Promise((resolve, reject) => {
    const worker = new Worker("/vendor/crypto-worker.js");
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("암호 해제 시간이 초과되었습니다."));
    }, 60000);
    const finish = () => {
      clearTimeout(timeout);
      worker.terminate();
    };
    worker.onmessage = (
      event: MessageEvent<{ buffer?: ArrayBuffer; error?: string }>,
    ) => {
      finish();
      if (event.data.buffer) resolve(event.data.buffer);
      else reject(new Error(event.data.error || "암호를 해제하지 못했습니다."));
    };
    worker.onerror = () => {
      finish();
      reject(
        new Error(
          "암호 해제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.",
        ),
      );
    };
    // Preserve the caller's original buffer while transferring only a disposable copy.
    const buffer = data.slice(0);
    worker.postMessage({ buffer, password: getExcelPassword() }, [buffer]);
  });
