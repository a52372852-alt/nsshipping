<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 버전 및 커밋 표시

- 사용자가 커밋에서 버전을 알아볼 수 있도록 제목을 `[v번호] 한글 변경 요약` 형식으로 작성한다.
- 배포 버전은 Sites 버전과 맞추며 `VERSION`, `CHANGELOG.md`를 함께 갱신한다. 복원 배포도 새 번호를 사용하고 복원 기준 버전을 명시한다.
- 배포 결과와 소스 커밋은 `docs/deployment.md`에 기록한다.

- 웹 하단은 `VERSION`과 `RELEASE_DATE`를 빌드 시 읽어 표시한다. 배포마다 두 파일을 실제 배포 버전과 한국 날짜(YYYY-MM-DD)로 갱신한다.
