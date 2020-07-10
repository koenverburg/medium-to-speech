build:
	docker build -t mts-image .

run:
	docker run --name test-medium -d mts-image
	docker logs test-medium -f

debug:
	docker exec -it test-medium /bin/bash

stop:
	docker stop test-medium

provision-shell:
	docker-machine start
 & "C:\Program Files\Docker Toolbox\docker-machine.exe" env --shell powershell | Invoke-Expression

run:
	docker