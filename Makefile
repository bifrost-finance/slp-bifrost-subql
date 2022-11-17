deploy:
	docker build -f Dockerfile -t harbor.liebi.com/slp-vmovr/bifrost-subql:v1.2 .
	docker push harbor.liebi.com/slp-vmovr/bifrost-subql:v1.2
	kubectl set image deploy -n slp slp-vksm-bifrost slp-vmovr-bifrost=harbor.liebi.com/slp-vmovr/bifrost-subql:v1.2
	kubectl set image deploy -n slp slp-vmovr-bifrost slp-vmovr-bifrost=harbor.liebi.com/slp-vmovr/bifrost-subql:v1.2
	kubectl rollout restart deploy  -n slp slp-vksm-bifrost slp-vmovr-bifrost
