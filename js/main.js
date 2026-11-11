var prim=[
{n:"Dom da Vida",e:"Origem de tudo o que vive.",d:"O primeiro sopro. Tudo o que nasce, cresce e se renova responde a ele. Seus abençoados lidam com o crescimento, a cura e os ciclos da vida.",m:"Nascimento, crescimento, cura e renovação.",s:'<path d="M32 56V28"/><path d="M26 56h12"/><path d="M32 40C20 40 13 33 13 21c12 0 19 7 19 19z"/><path d="M32 30C32 18 39 11 51 11c0 12-7 19-19 19z"/>'},
{n:"Dom da Morte",e:"O fim de tudo o que vive.",d:"O descanso final. Nada que vive escapa dele, e é ele que dá peso ao tempo que se tem. Seus abençoados lidam com o fim, o declínio e o silêncio que vem depois.",m:"Fim, declínio, descanso e esquecimento.",s:'<path d="M42 3L26 61"/><path d="M41 6C25 3 10 12 6 31C15 22 27 19 38 20Z" style="fill:color-mix(in srgb,var(--c) 28%,transparent)"/><path d="M37 10C26 9 17 15 12 25"/><path d="M35 33l6-1.5M32 44l6-1.5"/><path d="M26 61l-1.5 3"/>'},
{n:"Dom da Matéria",e:"Tudo o que tem forma e substância.",d:"A base de tudo o que se pode tocar. Do grão de areia à montanha, toda forma deriva dele. Seus abençoados moldam, endurecem e desfazem aquilo que tem corpo.",m:"Forma, peso, estrutura e substância.",s:'<path d="M32 8L53 20V44L32 56L11 44V20Z"/><path d="M11 20L32 32L53 20"/><path d="M32 32V56"/>'},
{n:"Dom do Espaço-Tempo",e:"Onde e quando tudo acontece.",d:"O palco e o relógio da existência. Cada distância e cada instante estão sob a sua sombra. Seus abençoados dobram lugares e momentos.",m:"Distância, lugar, instante e duração.",s:'<path d="M23 12h18c0 12-9 15-9 20s9 8 9 20H23c0-12 9-15 9-20s-9-8-9-20z"/><ellipse cx="32" cy="32" rx="29" ry="9" transform="rotate(-35 32 32)"/>'}];
document.getElementById('prim').innerHTML=prim.map(function(p,i){return '<article class="card pc'+(i%2?' red':'')+'"><div class="ico"><svg viewBox="0 0 64 64" aria-hidden="true">'+p.s+'</svg></div><div><h3>'+p.n+'</h3><p class="epi">'+p.e+'</p><p>'+p.d+'</p><p class="meta"><strong>Domínio:</strong> '+p.m+'</p></div></article>'}).join('');
var cats=[["Mental","Tudo o que envolve a mente. Ex.: pensamento acelerado, telecinese."],["Físico","Capacidades ligadas ao corpo físico."],["Elemental","Capacidades ligadas a um ou mais elementos."],["Poder","Amplificador de categorias. Deixa o dom mais forte por natureza e também pode ser usado como energia pura."],["Suporte","Habilidades utilitárias, de cura, buffs, debuffs e similares."],["Criação","Criar algo. Ex.: um robô gigante feito da própria EDOM."],["Invocação","Invocar um item, ser vivo, área ou poder."],["Transformação","Transformar partes do corpo ou coisas do ambiente."],["Controle","Controlar o que o seu dom faz. Ex.: invocar uma espada e guiá-la no ar."]];
document.getElementById('cats').innerHTML=cats.map(function(c){return '<article class="cat"><h3>'+c[0]+'</h3><p>'+c[1]+'</p></article>'}).join('');
var links=document.querySelectorAll('nav a');
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)});var on=document.querySelector('nav a.on');if(on){var n=on.parentNode;n.scrollTo({left:on.offsetLeft-n.clientWidth/2+on.clientWidth/2,behavior:'smooth'})}})},{rootMargin:'-45% 0px -50% 0px'});
links.forEach(function(a){var s=document.querySelector(a.getAttribute('href'));if(s)io.observe(s)});

(function(){
var d=document,r=d.documentElement,prog=d.getElementById('prog'),top=d.getElementById('top');
function upd(){var h=r.scrollHeight-innerHeight,p=h>0?scrollY/h:0;prog.style.setProperty('--p',p);top.classList.toggle('show',scrollY>700)}
addEventListener('scroll',upd,{passive:true});upd();
top.addEventListener('click',function(e){e.preventDefault();scrollTo({top:0,behavior:'smooth'})});
if('IntersectionObserver' in window){
 var els=d.querySelectorAll('.card,.cat,.big,.pane,.pairs>div,.bar,.sd,.tbl,.pips,.lead,.note');
 var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var el=e.target;el.classList.add('in');io2.unobserve(el);setTimeout(function(){el.style.transitionDelay=''},1100)}})},{threshold:.08,rootMargin:'0px 0px -6% 0px'});
 els.forEach(function(el){var i=[].indexOf.call(el.parentNode.children,el);el.style.transitionDelay=(i%3)*90+'ms';el.classList.add('rv');io2.observe(el)});
}
})();
