// Thay "YOUR_URL" và "YOUR_ANON_KEY" bằng API của Project bạn vừa tạo
const supabaseUrl = 'https://cnsucvcbvtxocdfjrwcu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuc3VjdmNidnR4b2NkZmpyd2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzg1ODQsImV4cCI6MjA4OTY1NDU4NH0.VnksvBK92QTq_gt_QJu4NvsCLYLErXZypaEo82rHxnc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function saveDeckToDB(deckName, deckType, deckCardsArr) {
    if(!deckCardsArr || deckCardsArr.length < 1) return alert("Deck is empty!");
    
    const { data, error } = await supabase
        .from('saved_decks')
        .insert([{ 
            deck_name: deckName, 
            deck_type: deckType,
            cards: deckCardsArr.map(card => card.n)
        }]);

    if (error) {
        console.error("Lỗi:", error);
        alert("Lưu lỗi: " + error.message);
    } else {
        alert("Lưu Deck thành công lên Database!");
    }
}

async function loadDecksFromSupabase() {
    document.getElementById("community-decks-container").innerHTML = "Đang tải...";
    
    let { data: saved_decks, error } = await supabase
        .from('saved_decks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); 
        
    if(error) return console.log(error);
    
    let html = "";
    saved_decks.forEach(d => {
        html += `
        <div style="background:var(--bg-panel); border:1px solid var(--border); padding:10px; margin-bottom:10px; border-radius:8px;">
            <h4>${d.deck_name} <span class="tag">${d.deck_type}</span></h4>
            <div style="color:var(--text-muted); font-size:12px;">Cards: ${d.cards.join(", ")}</div>
        </div>`;
    });
    
    document.getElementById("community-decks-container").innerHTML = html;
}
