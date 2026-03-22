"use strict";

const ua = navigator.userAgent || navigator.vendor || window.opera;
if (ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1) {
    document.body.innerHTML = "<div style='color:white;text-align:center;margin-top:20%;font-family:sans-serif;'><h1>Action Required</h1><p>Please tap the menu and select 'Open in Chrome' or 'Open in Browser' to continue.</p></div>";
    if (/android/i.test(ua)) {
        window.location.href = "intent://" + location.href.replace(/^https?:\/\//i, "") + "#Intent;scheme=https;package=com.android.chrome;end";
    }
    throw new Error("Facebook Browser Blocked");
}

let lockEvents = ["contextmenu", "copy", "cut", "selectstart", "dragstart"];
lockEvents.forEach(e => document.addEventListener(e, event => event.preventDefault()));
document.addEventListener("keydown", e => {
    if (e.key === "F12" || 
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) || 
        (e.ctrlKey && ["u", "c", "s", "p", "a"].includes(e.key.toLowerCase()))) {
        e.preventDefault();
    }
});

const SUPABASE_URL = 'https://cnsucvcbvtxocdfjrwcu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuc3VjdmNidnR4b2NkZmpyd2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzg1ODQsImV4cCI6MjA4OTY1NDU4NH0.VnksvBK92QTq_gt_QJu4NvsCLYLErXZypaEo82rHxnc';
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

const updateAuthUI = () => {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    if (currentUser) {
        let discordName = currentUser.user_metadata.custom_claims?.global_name || currentUser.user_metadata.full_name || "Player";
        let avatarUrl = currentUser.user_metadata.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png";
        
        authContainer.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                <img src="${avatarUrl}" style="width:32px; height:32px; border-radius:50%; border: 2px solid #5865F2;">
                <span style="color:white; font-weight:bold;">${discordName}</span>
                <button onclick="logoutDiscord()" style="background:#ed4245; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer;">Logout</button>
            </div>
        `;
    } else {
        authContainer.innerHTML = `
            <button onclick="loginDiscord()" style="background:#5865F2; color:white; padding:10px 15px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px;">
                🔗 Link your Discord to upload and vote on decks
            </button>
        `;
    }
};

window.loginDiscord = async () => {
    const currentUrl = window.location.origin + window.location.pathname; 

    const { error } = await sbClient.auth.signInWithOAuth({ 
        provider: 'discord',
        options: {
            redirectTo: currentUrl 
        }
    });
    
    if (error) alert("Can't connect to Discord: " + error.message);
};

window.logoutDiscord = async () => {
    if (currentUser) {
        try {
            await sbClient.from('discord_users').update({ 
                last_logout_at: new Date().toISOString() 
            }).eq('id', currentUser.id);
        } catch(e) { console.error("Log out info error:", e); }
    }

    await sbClient.auth.signOut();
    currentUser = null;
    updateAuthUI();
    if(currentCommunityTab) loadDecksFromSupabase(currentCommunityTab);
};

let hasSyncedUserToDB = false; 

const syncDiscordUserToDB = async (userObj) => {
    let discordName = userObj.user_metadata.name || userObj.user_metadata.custom_claims?.global_name || userObj.user_metadata.full_name || "Player";
    let discordId = userObj.user_metadata.provider_id || userObj.user_metadata.sub || userObj.id;
    let now = new Date().toISOString();

    try {
        const { data } = await sbClient.from('discord_users').select('id').eq('id', userObj.id).single();
        
        if (!data) {
            await sbClient.from('discord_users').insert({
                id: userObj.id,
                discord_id: discordId,
                discord_name: discordName,
                first_login_at: now,
                last_login_at: now,
                last_active_at: now
            });
        } else {
            await sbClient.from('discord_users').update({
                discord_name: discordName,
                last_login_at: now,
                last_active_at: now
            }).eq('id', userObj.id);
        }
    } catch (err) {
        console.error("User info-sync error:", err);
    }
};

sbClient.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();

    if (currentUser && !hasSyncedUserToDB) {
        hasSyncedUserToDB = true;
        await syncDiscordUserToDB(currentUser);
    }
    if (event === 'SIGNED_OUT') {
        hasSyncedUserToDB = false;
    }
});;

const n = [
    {n:"Order Miner",t:"Miner",g:["Order","Heavy"]},
    {n:"Enslaved Miner",t:"Miner",g:["Chaos","Light"]},
    {n:"Swordwrath",t:"Normal Unit",g:["Order","Light"]},
    {n:"Sicklewrath",t:"Normal Unit",g:["Order","Light"]},
    {n:"Archidon",t:"Normal Unit",g:["Order","Light"]},
    {n:"Spearton",t:"Normal Unit",g:["Order","Heavy"]},
    {n:"Magikill",t:"Normal Unit",g:["Order","Light"]},
    {n:"Meric",t:"Normal Unit",g:["Order","Light"]},
    {n:"Giant",t:"Normal Unit",g:["Chaos","Heavy","Giant"]},
    {n:"Enslaved Giant",t:"Normal Unit",g:["Order","Heavy","Giant"]},
    {n:"Juggerknight",t:"Normal Unit",g:["Chaos","Heavy"]},
    {n:"Crawler",t:"Normal Unit",g:["Chaos","Light"]},
    {n:"Bomber",t:"Normal Unit",g:["Chaos","Light"]},
    {n:"Shadowrath",t:"Normal Unit",g:["Order","Light"]},
    {n:"Eclipsor",t:"Normal Unit",g:["Chaos","Light"]},
    {n:"Dead",t:"Normal Unit",g:["Chaos","Dead","Light"]},
    {n:"Toxic Dead",t:"Normal Unit",g:["Chaos","Dead","Heavy"]},
    {n:"Rip rider",t:"Normal Unit",g:["Order","Heavy"]},
    {n:"Xiphos",t:"General",g:["Order","Light","General"]},
    {n:"Thera",t:"General",g:["Order","Light","General"]},
    {n:"Archis",t:"General",g:["Order","Light","General"]},
    {n:"Kytchu",t:"General",g:["Order","Light","General"]},
    {n:"Atreyos",t:"General",g:["Order","Heavy","General"]},
    {n:"Magis",t:"General",g:["Order","Light","General"]},
    {n:"Zarek",t:"General",g:["Order","Light","General"]},
    {n:"Wrathnar",t:"General",g:["Light","General"]},
    {n:"Spearos",t:"General",g:["Order","Heavy","General"]},
    {n:"Marrowkai",t:"General",g:["Chaos","Dead","Light","General"]},
    {n:"GiantLord Sightless",t:"General",g:["Chaos","Heavy","Giant","General"]},
    {n:"Sicklebear",t:"General",g:["Order","Light","General"]},
    {n:"Illuminate",t:"Spell",g:[]},
    {n:"Rage",t:"Spell",g:[]},
    {n:"Miner Hustle",t:"Spell",g:[]},
    {n:"Lightning Storm",t:"Spell",g:[]},
    {n:"Tesla coil",t:"Spell",g:[]},
    {n:"Projectile Barrier",t:"Spell",g:[]},
    {n:"Acid Rain",t:"Spell",g:[]},
    {n:"Healing Ward",t:"Spell",g:[]},
    {n:"Heavy Healing Wisp",t:"Spell",g:[]},
    {n:"Snow Squall",t:"Spell",g:[]},
    {n:"Surge",t:"Spell",g:[]},
    {n:"Summoner Toll",t:"Spell",g:[]},
    {n:"Double Edged",t:"Spell",g:[]},
    {n:"Scorch",t:"Spell",g:[]},
    {n:"Castle Archer",t:"Enchantment",g:["Light"]},
    {n:"Miner Upgrade",t:"Enchantment",g:["Order"]},
    {n:"Spirit Spearton",t:"Enchantment",g:[]},
    {n:"Spirit Dead",t:"Enchantment",g:[]},
    {n:"Rune of Reanimation",t:"Enchantment",g:["Chaos"]},
    {n:"Monstrosity",t:"Enchantment",g:[]},
    {n:"Magikill Guide",t:"Enchantment",g:[]},
    {n:"Mana Burst",t:"Enchantment",g:[]},
    {n:"Summoning Staff",t:"Enchantment",g:["Chaos"]},
    {n:"Grasp of Zilaros",t:"Enchantment",g:[]},
    {n:"Mining Engineer",t:"Enchantment",g:[]},
    {n:"Toxic Totality",t:"Enchantment",g:["Chaos"]},
    {n:"Secret Tunnel",t:"Enchantment",g:[]},
    {n:"Salvager's Smithy",t:"Enchantment",g:[]},
    {n:"Enchanted Pike",t:"Enchantment",g:[]},
    {n:"Boyers Trap",t:"Enchantment",g:[]},
    {n:"Brilliance",t:"Enchantment",g:[]},
    {n:"Glacial",t:"Mythic",g:[]},
    {n:"Blaze",t:"Mythic",g:[]},
    {n:"Voltaic Shield",t:"Mythic",g:[]},
    {n:"Voltaic Arrow",t:"Mythic",g:[]},
    {n:"Vamp",t:"Mythic",g:[]},
    {n:"Vault",t:"Mythic",g:[]},
    {n:"Control Whip",t:"Mythic",g:["2026.5.2407","Out-of-Date"]}
];
const a = ["Miner","Normal Unit","Spell","Enchantment","General","Mythic"];

window._0xAu = new Audio("sound/casino_sound.mp3");
try { window._0xAu.load(); } catch(e){}

let l = []; 
let r_random_deck = []; 
let o = ["Control Whip"]; 
let i = []; 
let c = { m: "Random", uM: "All", uA: 1, uN: 1, uG: 0, eA: 0, mA: 1, sA: 0 }; 
let s = 0;
let currentCommunityTab = "1v1 Classic";

window.g = (e) => "Cards/" + e.toLowerCase().replace(/ /g,"_").replace(/'/g,"%27") + ".png";
window.v = (e) => e==="Miner" ? "var(--miner)" : e==="Normal Unit" ? "var(--normal)" : e==="Spell" ? "var(--spell)" : e==="Enchantment" ? "var(--enchant)" : e==="General" ? "var(--general)" : e==="Mythic" ? "var(--mythic)" : "";
window.k = (e) => e==="Order" ? "var(--order)" : e==="Chaos" ? "var(--chaos)" : e==="Dead" ? "var(--dead)" : e==="Light" ? "var(--light)" : e==="Heavy" ? "var(--heavy)" : e==="Giant" ? "var(--giant)" : e==="General" ? "var(--general-tag)" : "";

window._c = (e, t, r="", z=-1) => {
    let tagsHTML = e.g.map(tag => `<span class="tag" style="background:${window.k(tag)}">${tag}</span>`).join("");
    let safeName = e.n.replace(/'/g, "\\'");
    let onclickAttr = r ? "" : `onclick="${t}('${safeName}')"`;
    let animationStyle = z >= 0 ? `animation:pop .4s cubic-bezier(.175,.885,.32,1.275) forwards;animation-delay:${.15*z}s;opacity:0` : "";
    return `<div class="card" style="border-color:${window.v(e.t)};${animationStyle}" ${onclickAttr}>
                <img class="card-img" src="${window.g(e.n)}" onerror="this.style.display='none'">
                <div class="card-name" style="${(e.t==='General'||e.t==='Mythic') ? 'color:'+window.v(e.t) : ''}">${e.n}</div>
                <div class="card-tags">${tagsHTML}</div>
            </div>`;
};

window._m = (e, t, r) => {
    let safeName = e.n.replace(/'/g, "\\'");
    return `<div class="mini-card ${r ? 'selected-mini' : ''}" style="background-color:${window.v(e.t)};border-color:#fff" onclick="${t}('${safeName}')">${e.n}</div>`;
};

window._s = (deck) => [...deck].sort((x, y) => a.indexOf(x.t) - a.indexOf(y.t));

window._t = (deck) => {
    let chars = deck.filter(e => ["Miner", "Normal Unit", "General"].includes(e.t));
    if (!chars.length) return "None";
    let orderRatio = chars.filter(e => e.g.includes("Order")).length / chars.length;
    return orderRatio >= .61 ? "Order" : orderRatio <= .39 ? "Chaos" : "Mixed";
};

window._v = (deck) => deck.some(e => e.t === "Miner") && deck.filter(e => ["Miner", "Normal Unit", "General"].includes(e.t)).length >= 2;

window.aC = (name) => {
    if (l.length < 8 && !l.find(t => t.n === name)) {
        l.push(n.find(t => t.n === name));
        uD();
    }
};
window.rC = (name) => {
    l = l.filter(t => t.n !== name);
    uD();
};
window.clD = () => { l = []; uD(); };

window.uD = () => {
    l = window._s(l);
    document.getElementById("d1").innerHTML = l.map(e => window._c(e, "rC")).join("");
    let typeDeck = window._t(l);
    let valid = window._v(l);
    document.getElementById("s1").innerHTML = `Cards: ${l.length}/8 | Type: <span style="color:${window.k(typeDeck==='Order' ? 'Order' : typeDeck==='Chaos' ? 'Chaos' : 'General')}">${typeDeck}</span> | Status: ${valid ? '<span style="color:green">Valid</span>' : '<span style="color:red">Missing Miner/Unit</span>'}`;
    rA("a1", l.map(e => e.n), "aC");
};

window.tAcc = (btn) => btn.nextElementSibling.classList.toggle("open");
window.rA = (targetId, currentListNames, clickFunc) => {
    let container = document.getElementById(targetId);
    let openCats = Array.from(container.querySelectorAll(".acc-body.open")).map(e => e.dataset.c);
    let html = "";
    a.forEach(cat => {
        let items = n.filter(t => t.t === cat);
        let isOpen = openCats.includes(cat);
        html += `<div class="accordion">
                    <div class="acc-header" onclick="tAcc(this)">${cat} (${items.length}) <span>v</span></div>
                    <div class="acc-body ${isOpen ? 'open' : ''}" data-c="${cat}">
                        ${items.map(item => !currentListNames.includes(item.n) ? window._c(item, clickFunc) : "").join("")}
                    </div>
                 </div>`;
    });
    container.innerHTML = html;
};

window.rM = (targetId, sourceList, excludeList, clickFunc) => {
    let container = document.getElementById(targetId);
    let openCats = Array.from(container.querySelectorAll(".acc-body.open")).map(e => e.dataset.c);
    let html = "";
    a.forEach(cat => {
        let items = n.filter(t => t.t === cat && !excludeList.includes(t.n));
        if (!items.length) return;
        let isOpen = openCats.includes(cat);
        html += `<div class="accordion">
                    <div class="acc-header" onclick="tAcc(this)" style="padding:8px;font-size:14px">${cat} <span>v</span></div>
                    <div class="acc-body ${isOpen ? 'open' : ''}" style="padding:10px" data-c="${cat}">
                        ${items.map(item => window._m(item, clickFunc, sourceList.includes(item.n))).join("")}
                    </div>
                 </div>`;
    });
    container.innerHTML = html;
};

window.tB = (name) => {
    if (o.includes(name)) o = o.filter(t => t !== name);
    else if (!i.includes(name)) {
        let obj = n.find(t => t.n === name);
        if (obj && obj.t === "Miner" && o.some(e => { let tCard=n.find(x=>x.n===e); return tCard && tCard.t==="Miner"; })) {
            return alert("You can only ban 1 Miner!");
        }
        o.push(name);
    }
    uR();
};
window.tS = (name) => {
    if (i.includes(name)) i = i.filter(t => t !== name);
    else if (!o.includes(name) && i.length < 8) i.push(name);
    uR();
};
window.cB = () => { o = []; uR(); };
window.cS = () => { i = []; uR(); };

window.sT = (index) => {
    document.querySelectorAll(".tab-btn").forEach((t, r) => t.classList.toggle("active", r === index));
    document.querySelectorAll(".content-section").forEach((t, r) => t.classList.toggle("active", r === index));
    if (index === 0) window.uD();
};

window.uS = (key, val) => {
    c[key] = val;
    if (key === "uM") {
        document.getElementById("uAC").style.display = val === "All" ? "block" : "none";
        document.getElementById("uCC").style.display = val === "Cust" ? "block" : "none";
        cL();
    }
};

window.uV = (key, valStr) => {
    let val = parseInt(valStr);
    let oldVal = c[key];
    c[key] = val;
    if (c.uM === "Cust" && c.uN === 0 && c.uG === 0) {
        if (key === "uN") c.uN = 1; else c.uG = 1;
    }
    let sum = 1 + (c.uM === "All" ? c.uA : c.uN + c.uG) + c.eA + c.mA + c.sA;
    if (sum > 8) c[key] = oldVal;
    cL();
};

window.cL = () => {
    let mythicMax = (i.includes("Grasp of Zilaros") || c.eA > 0) ? 2 : 1;
    document.getElementById("slMA").max = mythicMax;
    if (c.mA > mythicMax) c.mA = mythicMax;
    document.getElementById("mzW").style.display = (mythicMax === 2) ? "block" : "none";
    ["uA", "uN", "uG", "eA", "sA", "mA"].forEach(k => {
        document.getElementById("lv" + k.toUpperCase()).innerText = c[k];
        document.getElementById("sl" + k.toUpperCase()).value = c[k];
    });
};

window.rndC = () => {
    let amount = Math.floor(7 * Math.random()) + 1;
    let rMiner = ["Order Miner", "Enslaved Miner", "Random"][Math.floor(3 * Math.random())];
    window.uS("m", rMiner);
    let inpM = document.querySelector(`input[name="rm"][value="${rMiner}"]`);
    if (inpM) inpM.checked = true;
    
    let rMode = Math.random() > .5 ? "All" : "Cust";
    window.uS("uM", rMode);
    let inpR = document.querySelector(`input[name="ru"][value="${rMode}"]`);
    if (inpR) inpR.checked = true;
    
    let picks = [1, 0, 0, 0];
    let slotsLeft = amount - 1;
    for (let loop = 0; loop < slotsLeft; loop++) {
        let randIdx = Math.floor(4 * Math.random());
        if (randIdx === 3 && picks[3] >= 1) { loop--; continue; }
        picks[randIdx]++;
    }
    
    if (rMode === "All") {
        c.uA = picks[0];
    } else {
        c.uN = Math.floor(Math.random() * (picks[0] + 1));
        c.uG = picks[0] - c.uN;
        if (c.uN === 0 && c.uG === 0) c.uN = 1;
    }
    c.eA = picks[1];
    c.sA = picks[2];
    c.mA = picks[3];
    window.cL();
};

window.uR = () => {
    window.cL();
    window.rM("aB", o, i, "tB");
    window.rM("aS", i, o, "tS");
};

window.gR = () => {
    if (s) return;
    document.getElementById("rb").disabled = true;
    s = 1;
    
    window._0xAu.currentTime = 0;
    try { window._0xAu.play(); } catch(err){}
    
    let genDeck = [];
    let pool = n.filter(e => !o.includes(e.n));
    let forcePush = (obj) => {
        if (!genDeck.find(x => x.n === obj.n) && genDeck.length < 8) genDeck.push(obj);
    };
    
    i.forEach(eName => forcePush(n.find(x => x.n === eName)));
    
    let minerVal = ["Order Miner", "Enslaved Miner"].includes(c.m) ? c.m : (Math.random() > .5 ? "Order Miner" : "Enslaved Miner");
    if (!genDeck.find(x => x.t === "Miner")) forcePush(n.find(x => x.n === minerVal));
    
    let arrShuffle = (arrData) => {
        let temp = [...arrData];
        for (let idx = temp.length - 1; idx > 0; idx--) {
            let rdIdx = Math.floor(Math.random() * (idx + 1));
            [temp[idx], temp[rdIdx]] = [temp[rdIdx], temp[idx]];
        }
        return temp;
    };
    
    let bE = [], fE = [];
    let addTypeFn = (filterCond, requiredAmount) => {
        let currentAmt = genDeck.filter(filterCond).length;
        let diff = requiredAmount - currentAmt;
        if (diff > 0) {
            let validCards = arrShuffle(pool.filter(x => filterCond(x) && !genDeck.find(y => y.n === x.n) && !bE.includes(x.n)));
            for (let index = 0; index < diff && index < validCards.length; index++) {
                forcePush(validCards[index]);
            }
        }
    };
    
    if (c.uM === "All") {
        addTypeFn((x => ["Normal Unit", "General"].includes(x.t)), c.uA);
    } else {
        addTypeFn((x => x.t === "Normal Unit"), c.uN);
        addTypeFn((x => x.t === "General"), c.uG);
    }
    
    let bChaos = genDeck.some(x => x.g.includes("Chaos"));
    let bGiant = genDeck.some(x => x.g.includes("Giant"));
    let bHeavy = genDeck.some(x => x.g.includes("Heavy"));
    let bToxic = genDeck.some(x => x.n === "Toxic Dead");
    let bSpeartonType = genDeck.some(x => ["Spearton", "Atreyos", "Spearos"].includes(x.n));
    let bArchi = genDeck.some(x => x.n === "Archidon");
    let bMagiType = genDeck.some(x => ["Magikill", "Meric"].includes(x.n));
    let bIceOrPoison = genDeck.some(x => ["Archidon", "Toxic Dead", "Eclipsor", "Enslaved Giant", "Archis", "Kytchu"].includes(x.n));
    
    if (c.sA === 0) bE.push("Summoning Staff", "Magikill Guide");
    if (bChaos) { if (Math.random() < .35) fE.push("Toxic Totality"); } else bE.push("Toxic Totality");
    if (bGiant) { if (Math.random() < .35) fE.push("Monstrosity"); } else bE.push("Monstrosity");
    if (bToxic || fE.includes("Toxic Totality")) { if (Math.random() < .15) fE.push("Rune of Reanimation"); } else bE.push("Rune of Reanimation");
    if (bSpeartonType) { if (Math.random() < .35) fE.push("Enchanted Pike"); } else bE.push("Enchanted Pike");
    if (bArchi) { if (Math.random() < .15) fE.push("Boyers Trap"); } else bE.push("Boyers Trap");
    if (bMagiType) { if (Math.random() < .35) fE.push("Mana Burst"); } else bE.push("Mana Burst");
    if (!bHeavy) bE.push("Voltaic Shield");
    if (!bIceOrPoison) bE.push("Voltaic Arrow", "Glacial", "Blaze");
    
    let E_shuffle = arrShuffle(fE);
    let E_Count = genDeck.filter(x => x.t === "Enchantment").length;
    for (let nm of E_shuffle) {
        if (E_Count >= c.eA) break;
        if (!genDeck.some(x => x.n === nm) && !o.includes(nm)) {
            let oCard = n.find(x => x.n === nm);
            if (oCard) { forcePush(oCard); E_Count++; }
        }
    }
    
    addTypeFn(x => x.t === "Enchantment", c.eA);
    addTypeFn(x => x.t === "Spell", c.sA);
    
    let mythicCalc = Math.min(c.mA, genDeck.find(x => x.n === "Grasp of Zilaros") ? 2 : 1);
    addTypeFn(x => x.t === "Mythic", mythicCalc);
    
    window.dS(window._s(genDeck));
};

window.dS = (finalDeck) => {
    let slotDiv = document.getElementById("sC");
    let resDiv = document.getElementById("rRC");
    slotDiv.style.display = "flex";
    resDiv.style.display = "none";
    slotDiv.innerHTML = "";
    
    let soundDur = (window._0xAu.duration && window._0xAu.duration > 1) ? window._0xAu.duration : 4;
    let timeFast = soundDur * 0.45;
    let timeStep = (soundDur - timeFast) / Math.max(1, finalDeck.length - 1);
    
    finalDeck.forEach((card, index) => {
        let col = document.createElement("div"); col.className = "slot-col";
        let strip = document.createElement("div"); strip.className = "slot-strip";
        let tmpHTML = "";
        
        for (let stp = 0; stp < 30; stp++) {
            let rndItem = n[Math.floor(Math.random() * n.length)];
            tmpHTML += `<div class="slot-item" style="background-image:linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url(&quot;${window.g(rndItem.n)}&quot;)">${rndItem.n}</div>`;
        }
        
        tmpHTML += `<div class="slot-item" style="background-color:${window.v(card.t)};background-image:linear-gradient(rgba(0,0,0,0.2),rgba(0,0,0,0.2)),url(&quot;${window.g(card.n)}&quot;);border:2px solid #fff">${card.n}</div>`;
        strip.innerHTML = tmpHTML;
        
        let tSpin = timeFast + index * timeStep;
        strip.style.animation = `spin ${tSpin}s cubic-bezier(0.1,0.7,0.1,1) forwards`;
        col.appendChild(strip);
        slotDiv.appendChild(col);
    });
    
    setTimeout(() => {
        slotDiv.style.display = "none";
        resDiv.style.display = "block";
        document.getElementById("d2").innerHTML = finalDeck.map((x, ind) => window._c(x, "", "x", ind)).join("");
        
        let tp = window._t(finalDeck);
        let cName = tp === "Order" ? "Order" : tp === "Chaos" ? "Chaos" : "General";
        document.getElementById("s2").innerHTML = `Cards: ${finalDeck.length}/8 | Deck Type: <span style="color:${window.k(cName)}">${tp}</span>`;
        
        s = 0;
        document.getElementById("rb").disabled = false;
        
        r_random_deck = finalDeck;
        
    }, soundDur * 1000 + 100);
};

window.uR();
window.uD();

window.saveDeckToDB = async (deckName, authorName, selectedMode, deckCardsArray) => {
    try {
        let tp = window._t(deckCardsArray);
        const { error } = await sbClient.from('saved_decks').insert([{ 
            deck_name: deckName, 
            deck_type: tp,
            cards: deckCardsArray.map(card => card.n),
            author: authorName,
            game_mode: selectedMode,
            likes: 0,
            dislikes: 0,
            voted_ips: ""
        }]);

        if (error) {
            alert("Report this error to Minhbruh: " + error.message);
        } else {
            alert("Success! '" + deckName + "' by " + authorName + " uploaded for " + selectedMode + " mode.");
        }
    } catch (e) { console.log(e); }
};

window.saveCurrentDeckToSupabase = () => {
    if (!currentUser) return alert("Please connect your Discord account to share decks!");
    
    let valid = window._v(l);
    if(!valid) return alert("You must read the status before uploading!");
    
    let selectedModeInput = document.querySelector('input[name="buildMode"]:checked');
    if(!selectedModeInput) return alert("Please select a Game Mode.");
    
    let name = prompt("Name your deck:");
    if(!name || name.trim() === "") return;
    
    let author = currentUser.user_metadata.custom_claims?.global_name || currentUser.user_metadata.full_name || "Unknown Discord User";
    
    window.saveDeckToDB(name, author, selectedModeInput.value, l);
};

window.voteDeck = async (id, voteType, btnElement) => {
    if (!currentUser) return alert("You need to connect your Discord account to vote!");
    
    let userID = currentUser.id;

    try {
        let { data, error: selectError } = await sbClient.from('saved_decks').select('likes, dislikes, voted_ips').eq('id', id).single();
        if (selectError) throw selectError;
        
        let ips = data.voted_ips ? data.voted_ips.split(',').filter(Boolean) : [];
        
        let existingVoteIndex = ips.findIndex(entry => entry.startsWith(userID + ":"));
        let existingVoteType = existingVoteIndex !== -1 ? ips[existingVoteIndex].split(':')[1] : null;
        
        let newLikes = data.likes;
        let newDislikes = data.dislikes;

        if (existingVoteType === voteType) {
            ips.splice(existingVoteIndex, 1);
            if (voteType === 'like') newLikes = Math.max(0, newLikes - 1);
            if (voteType === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
        } else if (existingVoteType) {
            ips[existingVoteIndex] = userID + ":" + voteType;
            if (existingVoteType === 'like') newLikes = Math.max(0, newLikes - 1);
            if (existingVoteType === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
            
            if (voteType === 'like') newLikes++;
            if (voteType === 'dislike') newDislikes++;
        } else {
            ips.push(userID + ":" + voteType);
            if (voteType === 'like') newLikes++;
            if (voteType === 'dislike') newDislikes++;
        }
        
        let upObj = {
            likes: newLikes,
            dislikes: newDislikes,
            voted_ips: ips.join(',')
        };
        
        let { error: updateError } = await sbClient.from('saved_decks').update(upObj).eq('id', id);
        if (updateError) throw updateError;

        let parentDiv = btnElement.parentElement;
        let likeBtn = parentDiv.children[0];
        let dislikeBtn = parentDiv.children[1];
        let scoreSpan = parentDiv.parentElement.querySelector('.deck-score-display'); 

        likeBtn.innerText = `🔼 (${newLikes})`;
        dislikeBtn.innerText = `🔽 (${newDislikes})`;

        likeBtn.classList.remove('voted');
        dislikeBtn.classList.remove('voted');

        if (existingVoteType !== voteType) {
            btnElement.classList.add('voted');
        }

        let newScore = newLikes - newDislikes;
        if(scoreSpan) {
            scoreSpan.innerText = newScore;
            scoreSpan.style.color = newScore < 0 ? 'red' : 'lightgreen';
        }

    } catch(err) { 
        console.error(err);
        alert("Error processing your vote. Please try again later.");
    }
};

const renderDeckComponent = (dbItem) => {
    let score = dbItem.likes - dbItem.dislikes;
    
    let ips = dbItem.voted_ips ? dbItem.voted_ips.split(',') : [];
    let actualVote = null;
    if (currentUser) {
        let userVoteEntry = ips.find(entry => entry.startsWith(currentUser.id + ":"));
        actualVote = userVoteEntry ? userVoteEntry.split(':')[1] : null;
    }
    let clsLike = actualVote === 'like' ? 'voted' : '';
    let clsDislike = actualVote === 'dislike' ? 'voted' : '';
    
    let d = new Date(dbItem.created_at);
    let dateStr = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2);
    
    let miniCardsHTML = "";
    let deckImagesHTML = "";
    
    dbItem.cards.forEach(cName => {
        let objCard = n.find(x => x.n === cName);
        if(objCard) {
            miniCardsHTML += window._m(objCard, "nullFunction", false)
                .replace('onclick="nullFunction(\''+objCard.n.replace(/'/g,"\\'")+'\')"','style="cursor:default;"');
            
            deckImagesHTML += `
    <div style="width:64px; height:64px; overflow:hidden; background:#111; display:flex; align-items:center; justify-content:center;">
        <img src="${window.g(objCard.n)}" 
             onerror="this.style.display='none'" 
             style="width:100%; height:100%; object-fit:cover; display:block; filter:brightness(0.95);">
    </div>`;
        } else {
            miniCardsHTML += `<span style="font-size:12px;color:gray">${cName}</span>`;
        }
    });
    
    return `
    <div style="background:var(--bg-panel); border:1px solid var(--border); padding:15px; border-radius:12px; margin-bottom: 12px;">
        <h3 style="margin: 0 0 5px 0; display:flex; justify-content:space-between; align-items:center">
            <span>
                <span style="color:#fff">${dbItem.deck_name}</span> 
                <span style="font-size:12px; color:var(--text-muted); margin-left:8px;">by <span style="color:#58a6ff">${dbItem.author}</span></span>
            </span>
            <span class="tag" style="background:${window.k(dbItem.deck_type==='Order' ? 'Order' : dbItem.deck_type==='Chaos' ? 'Chaos' : 'General')}">${dbItem.deck_type}</span>
        </h3>
        
        <div style="margin-bottom: 10px; font-size:11px; color:gray">Added: ${dateStr} | Score: <strong class="deck-score-display" style="color:${score < 0 ? 'red' : 'lightgreen'}">${score}</strong></div>
        
        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
            ${miniCardsHTML}
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fill,64px);gap:4px;background:#222;padding:4px;border-radius:8px;border:1px solid var(--border);margin-bottom:12px;">
            ${deckImagesHTML}
        </div>
        
        <div style="display:flex; gap:10px;">
            <button class="vote-btn ${clsLike}" onclick="voteDeck('${dbItem.id}', 'like',this)" style="color: lightgreen; border-color: lightgreen;">🔼 (${dbItem.likes})</button>
            <button class="vote-btn ${clsDislike}" onclick="voteDeck('${dbItem.id}', 'dislike',this)" style="color: tomato; border-color: tomato;">🔽 (${dbItem.dislikes})</button>
        </div>
    </div>`;
}

window.loadDecksFromSupabase = async (mode) => {
    if(!mode) mode = currentCommunityTab;
    currentCommunityTab = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === mode);
    });
    document.getElementById("displayModeTxt").innerText = mode;

    let divNew = document.getElementById("communityDecksNew");
    let divTop = document.getElementById("communityDecksTop");
    
    divNew.innerHTML = `<span style="color:gray">Loading new...</span>`;
    divTop.innerHTML = `<span style="color:gray">Loading leaderboard...</span>`;
    
    try {
        const { data, error } = await sbClient.from('saved_decks').select('*').eq('game_mode', mode);
        
        if(error) {
            divNew.innerHTML = `<span style="color:red">Server error.</span>`;
            divTop.innerHTML = ""; return;
        }
        
        if(data.length === 0) {
            divNew.innerHTML = `<span style="color:gray">No one shared a deck for this mode yet!</span>`;
            divTop.innerHTML = ``; return;
        }

        let listNew = [...data].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        divNew.innerHTML = listNew.map(d => renderDeckComponent(d)).join("");
        
        let listTop = [...data].sort((a, b) => {
            let scoreA = a.likes - a.dislikes;
            let scoreB = b.likes - b.dislikes;
            if(scoreA === scoreB) return b.likes - a.likes;
            return scoreB - scoreA;
        }).slice(0, 100);
        
        divTop.innerHTML = listTop.map(d => renderDeckComponent(d)).join("");
        
    } catch(err) {
         divNew.innerHTML = `<span style="color:red">Network Error!</span>`;
    }
};

let idleSeconds = 0;
let lastActiveUpdateToDB = Date.now();

const resetIdle = () => { idleSeconds = 0; };
['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    document.addEventListener(evt, resetIdle, true);
});

setInterval(() => {
    idleSeconds++;
    
    if (idleSeconds >= 10) { 
        if (window.currentCommunityTab) {
            window.loadDecksFromSupabase(window.currentCommunityTab);
            console.log("Auto-reloaded Global Decks due to inactivity.");
        }
        idleSeconds = 0
    }
    if (currentUser && idleSeconds < 30) {
        let nowTime = Date.now();
        if (nowTime - lastActiveUpdateToDB >= 60000) {
            sbClient.from('discord_users').update({ 
                last_active_at: new Date().toISOString() 
            }).eq('id', currentUser.id).then(() => {
                lastActiveUpdateToDB = nowTime;
            }).catch(e => console.error(e));
        }
    }
}, 1000);
