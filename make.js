var fs=require('fs'); 
var html=fs.readFileSync('public/admin.html','utf8'); 
html=html.replace('alert(\"Login OK - panel en construccion\")', 'pwd=p;document.getElementById(\"login\").style.display=\"none\";document.getElementById(\"app\").style.display=\"block\";document.getElementById(\"hlabel\").textContent=base;loadClients()'); 
fs.writeFileSync('public/admin.html',html); 
console.log('OK'); 
