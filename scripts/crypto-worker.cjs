// Bundled locally; no remote scripts, file uploads, or password requests.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const officeCrypto = require("officecrypto-tool");
self.onmessage = async ({ data }) => {
  try {
    const decrypted = await officeCrypto.decrypt(data.buffer, {
      password: data.password,
    });
    const buffer = new Uint8Array(decrypted).slice().buffer;
    self.postMessage({ buffer }, [buffer]);
  } catch {
    self.postMessage({
      error:
        "암호화된 Excel을 열 수 없습니다. 설정의 Excel 비밀번호를 확인해주세요. 비밀번호가 맞다면 파일 손상 또는 지원하지 않는 암호화 형식일 수 있습니다.",
    });
  }
};
