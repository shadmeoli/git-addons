run:
	go run cmd/main.go

build:
	go build -o git-addonsv2 cmd/main.go


install:
	./install.sh


uninstall:
	./uninstall.sh
