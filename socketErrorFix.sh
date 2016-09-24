#!/bin/bash
sudo lsof -i :5000 | grep "python" | cut -d " " -f3 | xargs kill -9