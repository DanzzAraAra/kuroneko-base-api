const revealObserver=new IntersectionObserver((entries)=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
entry.target.classList.add('in');
revealObserver.unobserve(entry.target);
}
});
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

const updateInterval=1000;

async function fetchStats(){
try{
const response=await fetch('/stats/data');
const data=await response.json();
if(data.status){
const s=data.server;
document.getElementById('uptime').innerText=s.uptime;
document.getElementById('platform').innerText=s.hostname;
document.getElementById('arch').innerText=s.arch;
document.getElementById('node-ver').innerText=s.node_version;
document.getElementById('cpu-model').innerText=`${s.cpu.model} (${s.cpu.cores} Cores)`;
document.getElementById('cpu-load').innerText=(parseFloat(s.cpu.load)*10).toFixed(1)+'%';
document.getElementById('mem-used').innerText=s.memory.used;
document.getElementById('mem-total').innerText=s.memory.total;
document.getElementById('mem-free').innerText=s.memory.free;
const ramBar=document.getElementById('ram-bar');
const ramPct=document.getElementById('ram-percent');
ramBar.style.width=`${s.memory.percent}%`;
ramPct.innerText=`${s.memory.percent}%`;
ramBar.classList.remove('warn','danger');
if(s.memory.percent>90)ramBar.classList.add('danger');
else if(s.memory.percent>70)ramBar.classList.add('warn');
}
}catch(e){}
}

fetchStats();
setInterval(fetchStats,updateInterval);