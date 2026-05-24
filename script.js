/* ================= SUPABASE ================= */

const SUPABASE_URL = 'https://wepqievfgfqsoilynrhc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AUDqRGYqJi1pA7Y_QOIa-A_bIz-_zI1';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ================= BLOK COPY PASTE ================= */

document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());

/* ================= DATA ================= */

let semuaData = [];
let fotoLaporanList = [];

/* ================= INPUT AUTO ================= */

document.querySelectorAll('input,select').forEach(el=>{
  el.addEventListener('input',()=>{
    if(el.type!=='number' && el.type!=='file' && el.type!=='datetime-local'){
      el.value = el.value.toUpperCase();
    }
  });
});

/* ================= FORMAT ================= */

function formatTanggalJam(value){
  if(!value) return '-';
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

/* ================= NOPOL ================= */

const nopolInput = document.getElementById('nopol');
nopolInput.placeholder='B 1234 ABC';

nopolInput.addEventListener('input',()=>{
  let value=nopolInput.value.replace(/[^A-Z0-9]/gi,'').toUpperCase();
  let depan='',angka='',belakang='';
  for(let c of value){
    if(/[A-Z]/.test(c)&&angka==='')depan+=c;
    else if(/[0-9]/.test(c))angka+=c;
    else if(/[A-Z]/.test(c)&&angka!=='')belakang+=c;
  }
  nopolInput.value=(depan+(angka?' '+angka:'')+(belakang?' '+belakang:'')).trim();
});

/* ================= FOTO ================= */

const fotoLaporan=document.getElementById('fotoLaporan');
const previewFoto=document.getElementById('previewFoto');

fotoLaporan.addEventListener('change',function(){
  previewFoto.innerHTML='';
  fotoLaporanList=[];
  [...this.files].forEach(file=>{
    fotoLaporanList.push(file);
    const reader=new FileReader();
    reader.onload=e=>{
      const img=document.createElement('img');
      img.src=e.target.result;
      previewFoto.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

/* ================= LOAD ================= */

loadData();

async function loadData(){
  const {data,error}=await supabaseClient.from('phase_balance').select('*').order('id',{ascending:false});
  if(error)return alert('GAGAL LOAD DATA');
  semuaData=data||[];
  renderData();
}

/* ================= TAMBAH ================= */

async function tambahData(){

  const driver=document.getElementById('driver').value.trim();
  const nopol=document.getElementById('nopol').value.trim();
  const phase=document.getElementById('phase').value.trim();
  const jenis=document.getElementById('jenis').value;

  const suratjalan=parseInt(document.getElementById('suratjalan').value)||0;
  const kerja=parseInt(document.getElementById('kerja').value)||0;
  const nolabel=parseInt(document.getElementById('nolabel').value)||0;

  if(!driver||!phase)return alert('INPUT WAJIB');

  const totalreal=kerja+nolabel;

  let status='',classstatus='';

  if(totalreal===suratjalan){
    status='BALANCE';classstatus='balance';
  }else if(totalreal<suratjalan){
    status=`MINUS ${suratjalan-totalreal}`;classstatus='minus';
  }else{
    status=`PLUS ${totalreal-suratjalan}`;classstatus='plus';
  }

  const simpanData={driver,nopol,phase,jenis,suratjalan,kerja,nolabel,totalreal,status,classstatus};

  const {data,error}=await supabaseClient.from('phase_balance').insert([simpanData]).select();
  if(error)return alert('GAGAL SIMPAN');

  semuaData.unshift(data[0]);
  renderData();

  alert('DATA MASUK');
}

/* ================= RESET ================= */

async function resetData(){
  if(!confirm('HAPUS SEMUA?'))return;
  await supabaseClient.from('phase_balance').delete().neq('id',0);
  semuaData=[];
  renderData();
}

/* ================= REPORT ================= */

function generateReport(){

  const hasilReport=document.getElementById('hasilReport');
  const hasilStaging=document.getElementById('hasilStaging');

  if(!semuaData.length){
    hasilReport.innerText='BELUM ADA REPORT';
    hasilStaging.innerText='BELUM ADA STAGING';
    return;
  }

  let report='REPORT DAILY\n\n';
  let staging=[];

  semuaData.forEach((item,i)=>{
    report+=`${i+1}. PHASE ${item.phase}\nDRIVER ${item.driver}\nTOTAL ${item.totalreal}\n\n`;
    staging.push(`PHASE ${item.phase}`);
  });

  hasilReport.innerText=report;
  hasilStaging.innerText=[...new Set(staging)].join('\n');
}

/* ================= KIRIM ================= */

function kirimDailyReport(){
  generateReport();
  const text=document.getElementById('hasilReport').innerText;
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}

function kirimStagingReport(){
  generateReport();
  const text=document.getElementById('hasilStaging').innerText;
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}

/* ================= RENDER ================= */

function renderData(){

  let html='';
  let grandLabel=0,grandNoLabel=0;

  semuaData.forEach((item,i)=>{
    grandLabel+=Number(item.kerja);
    grandNoLabel+=Number(item.nolabel);

    html+=`
<div class="item">
${i+1}. PHASE ${item.phase}
DRIVER: ${item.driver}
NOPOL: ${item.nopol}
TOTAL: ${item.totalreal}
<span class="${item.classstatus}">STATUS: ${item.status}</span>
</div>`;
  });

  document.getElementById('listData').innerHTML=html;

  document.getElementById('grandTotal').innerHTML=
  `TOTAL LABEL: ${grandLabel}<br>TOTAL NO LABEL: ${grandNoLabel}`;

  generateReport();
}
