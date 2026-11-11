# ICP Chat 캐니스터

[Internet Computer](https://internetcomputer.org/)에서 채팅 메시지 HTTP API를 실험하는 TypeScript 캐니스터입니다. Azle로 빌드하는 `backend` 캐니스터가 Express API를 제공하고, Internet Identity로 로그인한 요청과 익명 요청의 principal을 조회하는 Lit 데모를 함께 서빙합니다.

실행에 필요한 소스와 설정은 [`master` 브랜치](https://github.com/sein12/icp-contest-canister/tree/master)에 있습니다. 채널형 채팅 UI는 [별도 React 저장소](https://github.com/sein12/icp-contest-site)에 있으며, 현재 해당 화면은 캐니스터 API를 호출하지 않습니다.

## 로컬 캐니스터 실행

기존 Azle 예제의 개발 환경은 Node.js 20, DFX 0.18.0과 Podman을 기준으로 합니다. Bash를 사용할 수 있는 환경에서 실행합니다. Windows에서는 [WSL](https://learn.microsoft.com/en-us/windows/wsl/install)을 사용할 수 있습니다. [Azle 0.21.1 환경 설정](https://github.com/demergent-labs/azle/tree/0.21.1/examples/hello_world#installation)

```bash
git clone --branch master https://github.com/sein12/icp-contest-canister.git
cd icp-contest-canister
npm ci
dfx start --background --host 127.0.0.1:8000
dfx deploy --network local
dfx canister id backend --network local
```

`dfx deploy`는 `npx azle backend`로 캐니스터를 빌드합니다. 빌드 과정에서 `npm run build`가 Lit 데모를 번들링하고, 캐니스터가 이를 `/dist`에서 정적 파일로 제공합니다. [빌드 설정](https://github.com/sein12/icp-contest-canister/blob/master/dfx.json)

캐니스터 ID를 확인한 뒤 브라우저에서 `http://<캐니스터-ID>.localhost:8000`을 엽니다. 데모 화면에서 `Whoami Unauthenticated` 버튼으로 익명 요청을 보내고, 로그인이 완료되면 `Whoami Authenticated` 버튼으로 인증 정보를 담은 요청을 보낼 수 있습니다.

| 빌드 환경 변수 | 용도 |
| --- | --- |
| `VITE_CANISTER_ORIGIN` | 데모가 `/whoami`를 호출할 주소입니다. 빌드 스크립트가 로컬 `backend` ID와 `8000` 포트로 설정합니다. |
| `VITE_IDENTITY_PROVIDER` | 데모 로그인에 사용할 Internet Identity 공급자 URL입니다. 별도 공급자를 사용할 경우 빌드 전에 설정합니다. |

실행 안내는 소스와 설정을 기준으로 작성했습니다. DFX 빌드·배포와 브라우저 실행은 검증하지 않았습니다.

## HTTP API

| 메서드와 경로 | 동작 |
| --- | --- |
| `GET /whoami` | `ic.caller()`가 반환한 호출자 principal을 텍스트로 응답합니다. |
| `POST /messages` | JSON 본문의 `user`와 `message`를 읽어 서버 시각과 함께 메시지 배열에 추가합니다. |
| `GET /messages` | 메시지 배열을 JSON으로 응답하도록 구현되어 있습니다. 아래 직렬화 제약을 참고하세요. |

로컬 캐니스터에 요청하려면 다음 명령을 사용합니다.

```bash
origin="http://$(dfx canister id backend --network local).localhost:8000"
curl --fail "$origin/whoami"
curl --fail "$origin/messages"
curl --fail --request POST \
  --header 'Content-Type: application/json' \
  --data '{"user":"demo","message":"hello"}' \
  "$origin/messages"
```

## 구현 범위

- 메시지는 캐니스터의 메모리 배열에 저장됩니다. 업그레이드나 재설치 뒤에도 유지하는 영구 저장소는 구현되어 있지 않습니다.
- 메시지 API의 작성자는 요청 본문의 `user`에서 가져옵니다. `/whoami`의 principal을 메시지 작성자나 접근 권한과 연결하는 처리는 없습니다.
- `POST /messages`는 `timestamp`를 `bigint`로 저장합니다. `GET /messages`는 이를 변환 없이 `res.json()`에 전달하므로, 메시지가 쌓이면 JSON 직렬화 오류가 발생할 수 있습니다.
- `npm test`는 기존 Azle 템플릿의 `/db`와 `/db/update` 예제를 검사하며, 실행 전 `pretest`가 `backend`의 코드를 제거하고 재배포합니다. 현재 메시지 API를 확인하려면 로컬 요청 예시를 사용합니다.

## 주요 소스

| 파일 | 역할 |
| --- | --- |
| [`src/backend/index.ts`](https://github.com/sein12/icp-contest-canister/blob/master/src/backend/index.ts) | Express 라우팅과 메시지 배열 |
| [`src/backend/index.did`](https://github.com/sein12/icp-contest-canister/blob/master/src/backend/index.did) | HTTP 게이트웨이의 Candid 진입점 |
| [`src/frontend/index.ts`](https://github.com/sein12/icp-contest-canister/blob/master/src/frontend/index.ts) | Internet Identity 로그인과 `/whoami` 조회 데모 |
| [`dfx.json`](https://github.com/sein12/icp-contest-canister/blob/master/dfx.json) | 캐니스터 빌드와 정적 파일 번들 설정 |

이 프로젝트는 [Azle Hello World](https://github.com/demergent-labs/azle/tree/0.21.1/examples/hello_world) 예제를 바탕으로 시작했습니다. 의존성 잠금 파일은 Azle 0.21.1, Express 4.18.2, Lit 3.1.2, Vite 5.0.12를 사용합니다. [Azle Book](https://demergent-labs.github.io/azle/)
