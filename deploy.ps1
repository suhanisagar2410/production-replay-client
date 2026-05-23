npm run build
scp -o StrictHostKeyChecking=no -i "C:\Users\Lenovo\Downloads\replay-key.pem" -r dist\* ubuntu@13.61.174.212:/var/www/replay/
echo "Deployment Complete! Your site is live at https://replay.suhanisagar.dev"
