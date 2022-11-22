IMAGE=harbor.liebi.com/slp/slp-bifrost-subql-dot:v1.2
DEPLOYMENT=slp-vdot-bifrost

deploy:
	docker build -f Dockerfile -t ${IMAGE} .
	docker push ${IMAGE}
	kubectl set image deploy -n slp ${DEPLOYMENT} ${DEPLOYMENT}=${IMAGE}
	kubectl rollout restart deploy  -n slp  ${DEPLOYMENT}
