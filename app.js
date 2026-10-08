'use strict';
(() => {
  const storage = {get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};
  const languagePreferenceKey = 'dz-language-v2';
  let language = storage.get(languagePreferenceKey) === 'zh' ? 'zh' : 'en';
  let filter = 'all';
  let toastTimer;
  const publications = window.PUBLICATIONS || [];
  const list = document.getElementById('publication-list');
  const search = document.getElementById('publication-search');
  const year = document.getElementById('publication-year');
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const label = (zh,en) => language === 'zh' ? zh : en;
  const roleLabels = {first:['第一作者','First author'],cofirst:['共同第一作者','Co-first author'],corresponding:['通讯作者','Corresponding author']};
  const title = p => p.language === 'zh' && language === 'en' ? p.titleEn || p.title : p.title;
  const journal = p => language === 'en' && p.journalEn ? p.journalEn : p.journal;
  const publisherUrl = p => p.publisher_url || p.url;
  const publisherLabel = p => p.publisher_url || !p.doi ? label('期刊官网','Journal website') : label('文章页面 / DOI','Article / DOI');
  const chemicalTitle = value => escapeHTML(value).replace(/PM(2\.5|1)(?!\d)/g,'PM<sub>$1</sub>').replace(/(?<![A-Za-z])O3(?!\d)/g,'O<sub>3</sub>').replace(/\bNOx\b/g,'NO<sub><i>x</i></sub>');
  const authors = p => (language === 'en' && p.authorsEn ? p.authorsEn : p.authors).map(author => /^(Dong Zhang|张栋)$/.test(author) ? `<strong>${escapeHTML(author)}</strong>` : escapeHTML(author)).join(', ');
  const citation = p => `${(language === 'en' && p.authorsEn ? p.authorsEn : p.authors).join(', ')} (${p.year}). ${title(p)}. ${journal(p)}, ${p.volume}${p.issue ? `(${p.issue})` : ''}, ${p.pages}. ${p.url}`;
  function showToast(message){const toast=document.getElementById('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600)}
  function render(){
    const query=search.value.trim().toLocaleLowerCase();
    const visible=publications.filter(p=>(filter==='all'||filter==='lead'&&p.role!=='coauthor'||p.language===filter)&&(year.value==='all'||String(p.year)===year.value)&&[p.title,p.titleEn,p.journal,...p.authors,...(p.authorsEn||[]),...(p.tags||[]),p.doi].join(' ').toLocaleLowerCase().includes(query));
    document.getElementById('publication-count').textContent=label(`当前显示 ${visible.length} 篇 · 目录共 ${publications.length} 篇`,`Showing ${visible.length} of ${publications.length} listed papers`);
    if(!visible.length){list.innerHTML=`<div class="no-results"><p>${label('没有匹配的论文，请调整关键词或筛选条件。','No matching publications. Try another keyword or filter.')}</p><button type="button" id="clear-filters" class="button">${label('清除筛选','Clear filters')}</button></div>`;document.getElementById('clear-filters').onclick=()=>{search.value='';year.value='all';setFilter('all')};return}
    const years=[...new Set(visible.map(p=>p.year))];
    list.innerHTML=years.map(y=>`<section class="year-group" aria-label="${y}"><h3 class="publication-year-heading">${y}</h3><div>${visible.filter(p=>p.year===y).map(p=>`<article class="paper ${p.language}"><h4><a href="${escapeHTML(publisherUrl(p))}" target="_blank" rel="noopener noreferrer">${chemicalTitle(title(p))}</a></h4><p class="paper-authors">${authors(p)}</p><p class="paper-meta"><span class="paper-journal">${escapeHTML(journal(p))}</span> · ${escapeHTML(p.volume)}${p.issue?`(${escapeHTML(p.issue)})`:''} · ${escapeHTML(p.pages)} · ${p.year}</p><div class="paper-links"><a data-link="publisher" href="${escapeHTML(publisherUrl(p))}" target="_blank" rel="noopener noreferrer">${publisherLabel(p)} ↗</a>${p.fulltext&&p.fulltext!==publisherUrl(p)?`<a href="${escapeHTML(p.fulltext)}" target="_blank" rel="noopener noreferrer">${label('全文','Full text')} ↗</a>`:''}${p.pdf?`<a data-link="pdf" href="${escapeHTML(p.pdf)}" target="_blank" rel="noopener noreferrer">PDF ↗</a>`:''}<button type="button" data-cite="${escapeHTML(p.id)}">${label('复制引用','Copy citation')}</button>${roleLabels[p.role]?`<span class="authorship">${roleLabels[p.role][language==='zh'?0:1]}</span>`:''}</div></article>`).join('')}</div></section>`).join('');
  }
  function setFilter(next){filter=next;document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});render()}
  function applyLanguage(){document.documentElement.lang=language==='zh'?'zh-CN':'en';document.querySelectorAll('[data-zh][data-en]').forEach(element=>{element.textContent=element.dataset[language]});document.querySelectorAll('[data-cv-link]').forEach(a=>a.href=language==='zh'?'cv.html':'cv-en.html');const button=document.getElementById('lang-toggle');button.textContent=language==='zh'?'EN':'中文';button.setAttribute('aria-label',label('Switch to English','切换中文'));search.placeholder=label('搜索标题、作者、期刊或关键词','Search title, author, journal or keyword');year.options[0].textContent=label('全部年份','All years');document.title=label('张栋 Dong Zhang · 大气污染研究与治理','Dong Zhang · Atmospheric Pollution Research');document.querySelector('meta[name=description]').content=label('张栋，郑州大学化学学院博士研究生。研究大气污染的来源、化学转化与治理，关注VOCs、大气氧化性、臭氧与二次有机气溶胶。','Dong Zhang, Ph.D. student at the College of Chemistry, Zhengzhou University. Atmospheric pollution, VOCs, atmospheric oxidation, ozone and secondary organic aerosols.');updateThemeLabel();render()}
  function updateThemeLabel(){document.getElementById('theme-toggle').setAttribute('aria-label',document.documentElement.dataset.theme==='dark'?label('切换浅色模式','Switch to light mode'):label('切换深色模式','Switch to dark mode'))}
  const savedTheme=storage.get('dz-theme');if(savedTheme==='dark'||!savedTheme&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark'}
  document.getElementById('theme-toggle').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;storage.set('dz-theme',next);updateThemeLabel()};
  document.getElementById('lang-toggle').onclick=()=>{language=language==='zh'?'en':'zh';storage.set(languagePreferenceKey,language);applyLanguage()};
  [...new Set(publications.map(p=>p.year))].forEach(y=>{const option=document.createElement('option');option.value=String(y);option.textContent=String(y);year.appendChild(option)});
  document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>setFilter(button.dataset.filter));search.oninput=render;year.onchange=render;
  list.addEventListener('click',async event=>{const button=event.target.closest('[data-cite]');if(!button)return;const paper=publications.find(p=>p.id===button.dataset.cite);if(!paper)return;const text=citation(paper);try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}else{const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px';document.body.appendChild(area);area.select();const copied=document.execCommand('copy');area.remove();if(!copied)throw Error('copy unavailable')}showToast(label('引用已复制','Citation copied'))}catch{showToast(label('复制未成功，请从论文页面获取引用','Copy failed. Please obtain the citation on the article page.'))}});
  document.getElementById('copyright-year').textContent=String(new Date().getFullYear());applyLanguage();
})();
