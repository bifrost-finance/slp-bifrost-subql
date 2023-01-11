IMAGE=hkccr.ccs.tencentyun.com/slp-service/slp-bifrost-subql-dot:v1.3
DEPLOYMENT=slp-vdot-bifrost

deploy:
	docker build -f Dockerfile -t ${IMAGE} .
	docker push ${IMAGE}
	kubectl set image deploy -n slp ${DEPLOYMENT} ${DEPLOYMENT}=${IMAGE}
	kubectl rollout restart deploy  -n slp  ${DEPLOYMENT} 

get:
	kubectl get deploy  -n slp  ${DEPLOYMENT} 
	kubectl get po -n slp -l k8s-app=${DEPLOYMENT}
