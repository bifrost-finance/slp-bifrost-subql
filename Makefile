IMAGE=hkccr.ccs.tencentyun.com/slp-service/slp-bifrost-subql-dot:v1.2
DEPLOYMENT1=slp-vdot-bifrost
DEPLOYMENT2=glmr-bifrost-subql

deploy:
	docker build -f Dockerfile -t ${IMAGE} .
	docker push ${IMAGE}
	kubectl set image deploy -n slp ${DEPLOYMENT1} ${DEPLOYMENT1}=${IMAGE}
	kubectl set image deploy -n slp ${DEPLOYMENT2} ${DEPLOYMENT2}=${IMAGE}
	kubectl rollout restart deploy  -n slp  ${DEPLOYMENT1} ${DEPLOYMENT2}

get:
	kubectl get deploy  -n slp  ${DEPLOYMENT1} ${DEPLOYMENT2}
