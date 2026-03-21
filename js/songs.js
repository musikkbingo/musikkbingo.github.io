// Full song pool for Music Bingo
// ~200 songs across 4 categories (~50 per category)
// Each game randomly picks 8 per category = 32 songs

window.SONG_POOL = [
  // ===== Norske sanger =====
  { title: "Take On Me", artist: "a-ha", category: "Norske sanger" },
  { title: "En solskinnsdag", artist: "Postgirobygget", category: "Norske sanger" },
  { title: "Hjerteknuser", artist: "Kaizers Orchestra", category: "Norske sanger" },
  { title: "Vinsjan på kaia", artist: "DDE", category: "Norske sanger" },
  { title: "Lys og varme", artist: "Åge Aleksandersen", category: "Norske sanger" },
  { title: "Eg ser", artist: "Bjørn Eidsvåg", category: "Norske sanger" },
  { title: "Strangers", artist: "Sigrid", category: "Norske sanger" },
  { title: "Runaway", artist: "Aurora", category: "Norske sanger" },
  { title: "Håper du har plass", artist: "Cezinando", category: "Norske sanger" },
  { title: "Sail Away", artist: "Röyksopp", category: "Norske sanger" },
  { title: "Riding", artist: "Dagny", category: "Norske sanger" },
  { title: "Sommerfuggel i vinterland", artist: "Hellbillies", category: "Norske sanger" },
  { title: "Alt jeg ønsker meg", artist: "Odd Nordstoga", category: "Norske sanger" },
  { title: "Tenk om", artist: "Postgirobygget", category: "Norske sanger" },
  { title: "Maestro", artist: "Kaizers Orchestra", category: "Norske sanger" },
  { title: "The Fox", artist: "Ylvis", category: "Norske sanger" },
  { title: "Hunting High and Low", artist: "a-ha", category: "Norske sanger" },
  { title: "The Sun Always Shines on T.V.", artist: "a-ha", category: "Norske sanger" },
  { title: "Crying in the Rain", artist: "a-ha", category: "Norske sanger" },
  { title: "Exist for Love", artist: "Aurora", category: "Norske sanger" },
  { title: "Mirror", artist: "Sigrid", category: "Norske sanger" },
  { title: "Don't Kill My Vibe", artist: "Sigrid", category: "Norske sanger" },
  { title: "Sucker Punch", artist: "Sigrid", category: "Norske sanger" },
  { title: "Beggin", artist: "Madcon", category: "Norske sanger" },
  { title: "Glow", artist: "Madcon", category: "Norske sanger" },
  { title: "Don't Worry", artist: "Madcon", category: "Norske sanger" },
  { title: "Tore Tang", artist: "DDE", category: "Norske sanger" },
  { title: "Ompa til du dansen!", artist: "Kaizers Orchestra", category: "Norske sanger" },
  { title: "Resistansen", artist: "Kaizers Orchestra", category: "Norske sanger" },
  { title: "Poor Leno", artist: "Röyksopp", category: "Norske sanger" },
  { title: "What Else Is There?", artist: "Röyksopp", category: "Norske sanger" },
  { title: "Queendom", artist: "Aurora", category: "Norske sanger" },
  { title: "Running Out of Time", artist: "Aurora", category: "Norske sanger" },
  { title: "Tilbake til deg", artist: "Bjørn Eidsvåg", category: "Norske sanger" },
  { title: "Floden", artist: "Bjørn Eidsvåg", category: "Norske sanger" },
  { title: "Backbeat", artist: "Dagny", category: "Norske sanger" },
  { title: "A Lovestory", artist: "Thomas Dybdahl", category: "Norske sanger" },
  { title: "One Day You'll Dance for Me, New York City", artist: "Thomas Dybdahl", category: "Norske sanger" },
  { title: "Au Pair", artist: "Karpe", category: "Norske sanger" },
  { title: "Hansen", artist: "Karpe", category: "Norske sanger" },
  { title: "Ei kansen te kaffe", artist: "Hellbillies", category: "Norske sanger" },
  { title: "For full musikk", artist: "Hellbillies", category: "Norske sanger" },
  { title: "Selv du", artist: "Cezinando", category: "Norske sanger" },
  { title: "Er dette alt", artist: "Cezinando", category: "Norske sanger" },
  { title: "Mitt lille land", artist: "Ole Paus", category: "Norske sanger" },
  { title: "Kveldssong for deg og meg", artist: "Odd Nordstoga", category: "Norske sanger" },
  { title: "Kvelden er din", artist: "Åge Aleksandersen", category: "Norske sanger" },
  { title: "Steinkjer i mitt hjerte", artist: "Åge Aleksandersen", category: "Norske sanger" },
  { title: "Shut Up", artist: "Madcon", category: "Norske sanger" },
  { title: "Freaky Like Me", artist: "Madcon", category: "Norske sanger" },

  // ===== Dansegulvet =====
  { title: "Dancing Queen", artist: "ABBA", category: "Dansegulvet" },
  { title: "September", artist: "Earth, Wind & Fire", category: "Dansegulvet" },
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", category: "Dansegulvet" },
  { title: "Don't Start Now", artist: "Dua Lipa", category: "Dansegulvet" },
  { title: "Stayin' Alive", artist: "Bee Gees", category: "Dansegulvet" },
  { title: "Billie Jean", artist: "Michael Jackson", category: "Dansegulvet" },
  { title: "I Wanna Dance with Somebody", artist: "Whitney Houston", category: "Dansegulvet" },
  { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper", category: "Dansegulvet" },
  { title: "Levitating", artist: "Dua Lipa", category: "Dansegulvet" },
  { title: "Blinding Lights", artist: "The Weeknd", category: "Dansegulvet" },
  { title: "Shake It Off", artist: "Taylor Swift", category: "Dansegulvet" },
  { title: "Mr. Brightside", artist: "The Killers", category: "Dansegulvet" },
  { title: "Rasputin", artist: "Boney M.", category: "Dansegulvet" },
  { title: "Hung Up", artist: "Madonna", category: "Dansegulvet" },
  { title: "Crazy In Love", artist: "Beyoncé", category: "Dansegulvet" },
  { title: "Shut Up and Dance", artist: "Walk the Moon", category: "Dansegulvet" },
  { title: "Can't Stop the Feeling", artist: "Justin Timberlake", category: "Dansegulvet" },
  { title: "Toxic", artist: "Britney Spears", category: "Dansegulvet" },
  { title: "Wannabe", artist: "Spice Girls", category: "Dansegulvet" },
  { title: "Pump It", artist: "The Black Eyed Peas", category: "Dansegulvet" },
  { title: "I Gotta Feeling", artist: "The Black Eyed Peas", category: "Dansegulvet" },
  { title: "Everybody", artist: "Backstreet Boys", category: "Dansegulvet" },
  { title: "Bye Bye Bye", artist: "NSYNC", category: "Dansegulvet" },
  { title: "Hips Don't Lie", artist: "Shakira", category: "Dansegulvet" },
  { title: "Waka Waka", artist: "Shakira", category: "Dansegulvet" },
  { title: "Single Ladies", artist: "Beyoncé", category: "Dansegulvet" },
  { title: "Party Rock Anthem", artist: "LMFAO", category: "Dansegulvet" },
  { title: "Dynamite", artist: "Taio Cruz", category: "Dansegulvet" },
  { title: "Club Can't Handle Me", artist: "Flo Rida", category: "Dansegulvet" },
  { title: "Yeah!", artist: "Usher", category: "Dansegulvet" },
  { title: "Get Lucky", artist: "Daft Punk", category: "Dansegulvet" },
  { title: "One More Time", artist: "Daft Punk", category: "Dansegulvet" },
  { title: "Titanium", artist: "David Guetta ft. Sia", category: "Dansegulvet" },
  { title: "Wake Me Up", artist: "Avicii", category: "Dansegulvet" },
  { title: "Levels", artist: "Avicii", category: "Dansegulvet" },
  { title: "Hey Ya!", artist: "OutKast", category: "Dansegulvet" },
  { title: "Poker Face", artist: "Lady Gaga", category: "Dansegulvet" },
  { title: "Bad Romance", artist: "Lady Gaga", category: "Dansegulvet" },
  { title: "Physical", artist: "Dua Lipa", category: "Dansegulvet" },
  { title: "Rain On Me", artist: "Lady Gaga", category: "Dansegulvet" },
  { title: "As It Was", artist: "Harry Styles", category: "Dansegulvet" },
  { title: "Flowers", artist: "Miley Cyrus", category: "Dansegulvet" },
  { title: "About Damn Time", artist: "Lizzo", category: "Dansegulvet" },
  { title: "Cha Cha Slide", artist: "DJ Casper", category: "Dansegulvet" },
  { title: "Macarena", artist: "Los del Rio", category: "Dansegulvet" },
  { title: "Cotton Eye Joe", artist: "Rednex", category: "Dansegulvet" },
  { title: "Saturday Night", artist: "Whigfield", category: "Dansegulvet" },
  { title: "Blue (Da Ba Dee)", artist: "Eiffel 65", category: "Dansegulvet" },
  { title: "Sandstorm", artist: "Darude", category: "Dansegulvet" },
  { title: "Freed from Desire", artist: "Gala", category: "Dansegulvet" },

  // ===== Kjærleik =====
  { title: "I Will Always Love You", artist: "Whitney Houston", category: "Kjærleik" },
  { title: "Someone Like You", artist: "Adele", category: "Kjærleik" },
  { title: "Perfect", artist: "Ed Sheeran", category: "Kjærleik" },
  { title: "All of Me", artist: "John Legend", category: "Kjærleik" },
  { title: "Your Song", artist: "Elton John", category: "Kjærleik" },
  { title: "My Heart Will Go On", artist: "Celine Dion", category: "Kjærleik" },
  { title: "Can't Help Falling in Love", artist: "Elvis Presley", category: "Kjærleik" },
  { title: "Shallow", artist: "Lady Gaga", category: "Kjærleik" },
  { title: "Make You Feel My Love", artist: "Adele", category: "Kjærleik" },
  { title: "Unchained Melody", artist: "The Righteous Brothers", category: "Kjærleik" },
  { title: "A Thousand Years", artist: "Christina Perri", category: "Kjærleik" },
  { title: "Thinking Out Loud", artist: "Ed Sheeran", category: "Kjærleik" },
  { title: "Just the Way You Are", artist: "Bruno Mars", category: "Kjærleik" },
  { title: "At Last", artist: "Etta James", category: "Kjærleik" },
  { title: "I Don't Want to Miss a Thing", artist: "Aerosmith", category: "Kjærleik" },
  { title: "Endless Love", artist: "Diana Ross & Lionel Richie", category: "Kjærleik" },
  { title: "I Will Follow You into the Dark", artist: "Death Cab for Cutie", category: "Kjærleik" },
  { title: "Kissing You", artist: "Des'ree", category: "Kjærleik" },
  { title: "The Power of Love", artist: "Huey Lewis and the News", category: "Kjærleik" },
  { title: "Nothing Compares 2 U", artist: "Sinéad O'Connor", category: "Kjærleik" },
  { title: "Crazy", artist: "Patsy Cline", category: "Kjærleik" },
  { title: "When a Man Loves a Woman", artist: "Percy Sledge", category: "Kjærleik" },
  { title: "Let's Stay Together", artist: "Al Green", category: "Kjærleik" },
  { title: "I'm Yours", artist: "Jason Mraz", category: "Kjærleik" },
  { title: "Ho Hey", artist: "The Lumineers", category: "Kjærleik" },
  { title: "Love Story", artist: "Taylor Swift", category: "Kjærleik" },
  { title: "You Are the Reason", artist: "Calum Scott", category: "Kjærleik" },
  { title: "Say You Won't Let Go", artist: "James Arthur", category: "Kjærleik" },
  { title: "All You Need Is Love", artist: "The Beatles", category: "Kjærleik" },
  { title: "Something", artist: "The Beatles", category: "Kjærleik" },
  { title: "Wonderful Tonight", artist: "Eric Clapton", category: "Kjærleik" },
  { title: "You're Beautiful", artist: "James Blunt", category: "Kjærleik" },
  { title: "Amazed", artist: "Lonestar", category: "Kjærleik" },
  { title: "I Knew You Were Waiting", artist: "Aretha Franklin & George Michael", category: "Kjærleik" },
  { title: "Total Eclipse of the Heart", artist: "Bonnie Tyler", category: "Kjærleik" },
  { title: "Take My Breath Away", artist: "Berlin", category: "Kjærleik" },
  { title: "Eternal Flame", artist: "The Bangles", category: "Kjærleik" },
  { title: "I Just Called to Say I Love You", artist: "Stevie Wonder", category: "Kjærleik" },
  { title: "Truly Madly Deeply", artist: "Savage Garden", category: "Kjærleik" },
  { title: "Everything I Do", artist: "Bryan Adams", category: "Kjærleik" },
  { title: "Hero", artist: "Enrique Iglesias", category: "Kjærleik" },
  { title: "Because You Loved Me", artist: "Celine Dion", category: "Kjærleik" },
  { title: "From This Moment On", artist: "Shania Twain", category: "Kjærleik" },
  { title: "Un-Break My Heart", artist: "Toni Braxton", category: "Kjærleik" },
  { title: "Always", artist: "Bon Jovi", category: "Kjærleik" },
  { title: "Lady in Red", artist: "Chris de Burgh", category: "Kjærleik" },
  { title: "The Way You Look Tonight", artist: "Frank Sinatra", category: "Kjærleik" },
  { title: "Fly Me to the Moon", artist: "Frank Sinatra", category: "Kjærleik" },
  { title: "Can't Help Lovin' Dat Man", artist: "Ella Fitzgerald", category: "Kjærleik" },
  { title: "Die with a Smile", artist: "Lady Gaga & Bruno Mars", category: "Kjærleik" },

  // ===== Tidenes hits =====
  { title: "Bohemian Rhapsody", artist: "Queen", category: "Tidenes hits" },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", category: "Tidenes hits" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", category: "Tidenes hits" },
  { title: "Highway to Hell", artist: "AC/DC", category: "Tidenes hits" },
  { title: "Don't Stop Believin'", artist: "Journey", category: "Tidenes hits" },
  { title: "Africa", artist: "Toto", category: "Tidenes hits" },
  { title: "Eye of the Tiger", artist: "Survivor", category: "Tidenes hits" },
  { title: "The Final Countdown", artist: "Europe", category: "Tidenes hits" },
  { title: "We Will Rock You", artist: "Queen", category: "Tidenes hits" },
  { title: "Back in Black", artist: "AC/DC", category: "Tidenes hits" },
  { title: "Sweet Home Alabama", artist: "Lynyrd Skynyrd", category: "Tidenes hits" },
  { title: "Thunderstruck", artist: "AC/DC", category: "Tidenes hits" },
  { title: "You Give Love a Bad Name", artist: "Bon Jovi", category: "Tidenes hits" },
  { title: "Pour Some Sugar on Me", artist: "Def Leppard", category: "Tidenes hits" },
  { title: "Another One Bites the Dust", artist: "Queen", category: "Tidenes hits" },
  { title: "Welcome to the Jungle", artist: "Guns N' Roses", category: "Tidenes hits" },
  { title: "Smoke on the Water", artist: "Deep Purple", category: "Tidenes hits" },
  { title: "Stairway to Heaven", artist: "Led Zeppelin", category: "Tidenes hits" },
  { title: "Hotel California", artist: "Eagles", category: "Tidenes hits" },
  { title: "Born to Run", artist: "Bruce Springsteen", category: "Tidenes hits" },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", category: "Tidenes hits" },
  { title: "Under the Bridge", artist: "Red Hot Chili Peppers", category: "Tidenes hits" },
  { title: "Californication", artist: "Red Hot Chili Peppers", category: "Tidenes hits" },
  { title: "Losing My Religion", artist: "R.E.M.", category: "Tidenes hits" },
  { title: "Wonderwall", artist: "Oasis", category: "Tidenes hits" },
  { title: "Don't Look Back in Anger", artist: "Oasis", category: "Tidenes hits" },
  { title: "With or Without You", artist: "U2", category: "Tidenes hits" },
  { title: "Where the Streets Have No Name", artist: "U2", category: "Tidenes hits" },
  { title: "Wish You Were Here", artist: "Pink Floyd", category: "Tidenes hits" },
  { title: "Comfortably Numb", artist: "Pink Floyd", category: "Tidenes hits" },
  { title: "Paint It Black", artist: "The Rolling Stones", category: "Tidenes hits" },
  { title: "Satisfaction", artist: "The Rolling Stones", category: "Tidenes hits" },
  { title: "Hey Jude", artist: "The Beatles", category: "Tidenes hits" },
  { title: "Let It Be", artist: "The Beatles", category: "Tidenes hits" },
  { title: "Come As You Are", artist: "Nirvana", category: "Tidenes hits" },
  { title: "Creep", artist: "Radiohead", category: "Tidenes hits" },
  { title: "Seven Nation Army", artist: "The White Stripes", category: "Tidenes hits" },
  { title: "Sultans of Swing", artist: "Dire Straits", category: "Tidenes hits" },
  { title: "Money for Nothing", artist: "Dire Straits", category: "Tidenes hits" },
  { title: "Walk This Way", artist: "Aerosmith", category: "Tidenes hits" },
  { title: "Dream On", artist: "Aerosmith", category: "Tidenes hits" },
  { title: "November Rain", artist: "Guns N' Roses", category: "Tidenes hits" },
  { title: "Knockin' on Heaven's Door", artist: "Guns N' Roses", category: "Tidenes hits" },
  { title: "Purple Rain", artist: "Prince", category: "Tidenes hits" },
  { title: "Billie Jean", artist: "Michael Jackson", category: "Tidenes hits" },
  { title: "Beat It", artist: "Michael Jackson", category: "Tidenes hits" },
  { title: "Superstition", artist: "Stevie Wonder", category: "Tidenes hits" },
  { title: "Respect", artist: "Aretha Franklin", category: "Tidenes hits" },
  { title: "What a Wonderful World", artist: "Louis Armstrong", category: "Tidenes hits" },
  { title: "Imagine", artist: "John Lennon", category: "Tidenes hits" }
];

/**
 * Pick 32 random songs (8 per category) from the pool.
 * Returns an array of song objects with number property added (1-32).
 */
window.pickSongsForGame = function () {
  var categories = {};
  var categoryOrder = [];

  for (var i = 0; i < window.SONG_POOL.length; i++) {
    var cat = window.SONG_POOL[i].category;
    if (!categories[cat]) {
      categories[cat] = [];
      categoryOrder.push(cat);
    }
    categories[cat].push(window.SONG_POOL[i]);
  }

  var picked = [];
  var num = 1;
  for (var c = 0; c < categoryOrder.length; c++) {
    var catSongs = categories[categoryOrder[c]].slice();
    for (var j = catSongs.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = catSongs[j];
      catSongs[j] = catSongs[k];
      catSongs[k] = tmp;
    }
    var take = catSongs.slice(0, 8);
    for (var t = 0; t < take.length; t++) {
      picked.push({
        number: num++,
        title: take[t].title,
        artist: take[t].artist,
        category: take[t].category,
        spotifyUri: take[t].spotifyUri || null
      });
    }
  }

  return picked;
};

window.DEFAULT_SONGS = window.pickSongsForGame();
