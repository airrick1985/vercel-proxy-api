#!/bin/bash

curl -X POST https://vercel-proxy-api2.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"name":"陳文賢","password":"0123"}'
