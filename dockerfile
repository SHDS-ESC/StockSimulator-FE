# ---------- 1) Build stage: Vite 빌드 ----------
FROM node:20-alpine AS build
WORKDIR /app
# srv/vite/ 폴더에 프로젝트가 있으므로 경로 명시
COPY package*.json ./vite/
WORKDIR /app/vite
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
# Vite 설정/환경 & 엔트리/소스/정적
COPY vite.config.* ./
COPY index.html ./index.html
COPY src ./src
COPY .env* ./
COPY public ./public
# (선택) 경로 문제 디버깅: 필요한 경우 아래 열고 테스트
# RUN test -f /app/vite/src/shared/assets/img/checkin.png || (echo "MISSING checkin.png" && ls -R /app/vite/src/shared/assets/img && exit 1)
RUN npm run build

# ---------- 2) Runtime: Nginx ----------
FROM nginx:1.27-alpine
# SSL 인증서 생성
RUN apk add --no-cache openssl && \
    mkdir -p /etc/ssl/certs /etc/ssl/private && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=KR/ST=Seoul/L=Seoul/O=Ohgoodpay/CN=localhost"
# SPA 새로고침 404 방지, gzip 등 설정
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# 빌드 산출물 배포 경로
COPY --from=build /app/vite/dist /usr/share/nginx/html
# CSS 파일을 직접 서빙할 수 있도록 src 폴더 복사
COPY --from=build /app/vite/src /usr/share/nginx/html/src
EXPOSE 80 443
CMD ["nginx","-g","daemon off;"]

