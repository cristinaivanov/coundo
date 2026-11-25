export const CONTINENTS = [
  { id: 'eu', name: 'Europe', view: [-25, 34, 60, 72] },
  { id: 'sa', name: 'South America', view: [-93, -56, -33, 14] },
  { id: 'na', name: 'North America', view: [-168, 6, -52, 74] },
  { id: 'as', name: 'Asia', view: [26, -12, 150, 56] },
  { id: 'af', name: 'Africa', view: [-26, -36, 60, 38] },
  { id: 'oc', name: 'Oceania', view: [110, -49, 194, 20] },
];

// Views are [west, south, east, north] in degrees.
export const REGIONS = [
  { id: 'west-europe', continent: 'eu', name: 'Western Europe', view: [-11.5, 42, 9, 60], codes: ['fr', 'gb', 'ie', 'be', 'nl', 'lu', 'mc'] },
  { id: 'south-europe', continent: 'eu', name: 'Iberia & Italy', view: [-10.5, 35, 19, 47.5], codes: ['es', 'pt', 'it', 'ad', 'sm', 'va', 'mt'] },
  { id: 'central-europe', continent: 'eu', name: 'Central Europe', view: [5, 45, 25.5, 55.5], codes: ['de', 'ch', 'at', 'li', 'cz', 'pl', 'sk', 'hu'] },
  { id: 'north-europe', continent: 'eu', name: 'Nordics & Baltics', view: [-25, 53.5, 32, 71.5], codes: ['no', 'se', 'fi', 'dk', 'is', 'ee', 'lv', 'lt'] },
  { id: 'balkans', continent: 'eu', name: 'Balkans', view: [12.5, 34.5, 29.5, 47.5], codes: ['gr', 'hr', 'si', 'rs', 'ba', 'me', 'al', 'mk', 'xk'] },
  { id: 'east-europe', continent: 'eu', name: 'Eastern Europe', view: [19, 40.5, 62, 68], codes: ['ro', 'md', 'bg', 'ua', 'by', 'ru'] },

  { id: 'north-south-america', continent: 'sa', name: 'Northern South America', view: [-83, -19.5, -50, 13.5], codes: ['co', 've', 'ec', 'pe', 'gy', 'sr'] },
  { id: 'southern-cone', continent: 'sa', name: 'Brazil & the South', view: [-77, -56.5, -33, 6.5], codes: ['br', 'ar', 'cl', 'uy', 'py', 'bo'] },

  { id: 'north-america', continent: 'na', name: 'Northern America', view: [-168, 12, -52, 74], codes: ['us', 'ca', 'mx'] },
  { id: 'central-america', continent: 'na', name: 'Central America', view: [-93, 6.5, -76.5, 19], codes: ['gt', 'bz', 'hn', 'sv', 'ni', 'cr', 'pa'] },
  { id: 'greater-antilles', continent: 'na', name: 'Greater Caribbean', view: [-86, 16.5, -67, 28], codes: ['cu', 'jm', 'ht', 'do', 'bs'] },
  { id: 'lesser-antilles', continent: 'na', name: 'Eastern Caribbean', view: [-64.5, 9.5, -58.5, 18.5], codes: ['kn', 'ag', 'dm', 'lc', 'vc', 'bb', 'gd', 'tt'] },

  { id: 'middle-east', continent: 'as', name: 'Near East', view: [25, 28.5, 49.5, 42.8], codes: ['tr', 'cy', 'sy', 'lb', 'il', 'ps', 'jo', 'iq'] },
  { id: 'gulf', continent: 'as', name: 'Arabia & the Gulf', view: [33.5, 11.5, 64, 40.5], codes: ['sa', 'ae', 'qa', 'bh', 'kw', 'om', 'ye', 'ir'] },
  { id: 'caucasus-central-asia', continent: 'as', name: 'Caucasus & Central Asia', view: [38, 34, 88, 56], codes: ['ge', 'am', 'az', 'kz', 'uz', 'tm', 'kg', 'tj'] },
  { id: 'south-asia', continent: 'as', name: 'South Asia', view: [59, -2, 98, 39], codes: ['in', 'pk', 'np', 'bd', 'lk', 'bt', 'mv', 'af'] },
  { id: 'east-asia', continent: 'as', name: 'East Asia', view: [72, 17, 148, 55], codes: ['cn', 'jp', 'kr', 'kp', 'mn', 'tw'] },
  { id: 'southeast-asia', continent: 'as', name: 'Southeast Asia', view: [91, -12, 143, 29], codes: ['th', 'vn', 'kh', 'la', 'mm', 'my', 'sg', 'id', 'ph', 'bn', 'tl'] },

  { id: 'north-africa', continent: 'af', name: 'North Africa', view: [-18, 7, 38.5, 38.5], codes: ['eg', 'ma', 'dz', 'tn', 'ly', 'sd'] },
  { id: 'atlantic-africa', continent: 'af', name: 'Atlantic West Africa', view: [-26, 3.5, -4, 28], codes: ['sn', 'mr', 'gm', 'gw', 'gn', 'sl', 'lr', 'cv'] },
  { id: 'west-africa', continent: 'af', name: 'Gulf of Guinea & Sahel', view: [-13, 3.5, 17, 26], codes: ['ng', 'gh', 'ci', 'tg', 'bj', 'bf', 'ml', 'ne'] },
  { id: 'central-africa', continent: 'af', name: 'Central Africa', view: [4.5, -14, 32.5, 24.5], codes: ['cm', 'td', 'cf', 'gq', 'ga', 'cg', 'cd', 'st'] },
  { id: 'east-africa', continent: 'af', name: 'East Africa', view: [27.5, -12.5, 52.5, 18.5], codes: ['et', 'ke', 'tz', 'ug', 'rw', 'bi', 'so', 'dj', 'er', 'ss'] },
  { id: 'southern-africa', continent: 'af', name: 'Southern Africa', view: [11, -36, 42, -4], codes: ['za', 'na', 'bw', 'zw', 'mz', 'zm', 'ao', 'mw', 'ls', 'sz'] },
  { id: 'indian-ocean', continent: 'af', name: 'Indian Ocean Islands', view: [41, -27, 60, -2], codes: ['mg', 'mu', 'sc', 'km'] },

  { id: 'melanesia', continent: 'oc', name: 'Australia & Melanesia', view: [110, -49, 181, 1], codes: ['au', 'nz', 'pg', 'fj', 'sb', 'vu'] },
  { id: 'polynesia', continent: 'oc', name: 'Pacific Islands', view: [129, -26, 190, 14], codes: ['ws', 'to', 'ki', 'tv', 'nr', 'mh', 'fm', 'pw'] },
];

// code | name | capital | other accepted answers | note
const ROWS = `
fr|France|Paris
gb|the United Kingdom|London
ie|Ireland|Dublin
be|Belgium|Brussels
nl|the Netherlands|Amsterdam||The government sits in The Hague.
lu|Luxembourg|Luxembourg|Luxembourg City
mc|Monaco|Monaco|Monaco City, Monaco-Ville
es|Spain|Madrid
pt|Portugal|Lisbon|Lisboa
it|Italy|Rome|Roma
ad|Andorra|Andorra la Vella
sm|San Marino|San Marino|City of San Marino
va|Vatican City|Vatican City|Vatican
mt|Malta|Valletta|La Valletta
de|Germany|Berlin
ch|Switzerland|Bern|Berne
at|Austria|Vienna|Wien
li|Liechtenstein|Vaduz
cz|Czechia|Prague|Praha|Also called the Czech Republic.
pl|Poland|Warsaw|Warszawa
sk|Slovakia|Bratislava
hu|Hungary|Budapest
no|Norway|Oslo
se|Sweden|Stockholm
fi|Finland|Helsinki
dk|Denmark|Copenhagen
is|Iceland|Reykjavík
ee|Estonia|Tallinn
lv|Latvia|Riga
lt|Lithuania|Vilnius
gr|Greece|Athens
hr|Croatia|Zagreb
si|Slovenia|Ljubljana
rs|Serbia|Belgrade|Beograd
ba|Bosnia and Herzegovina|Sarajevo
me|Montenegro|Podgorica
al|Albania|Tirana
mk|North Macedonia|Skopje
xk|Kosovo|Pristina|Prishtina
ro|Romania|Bucharest|București
md|Moldova|Chișinău|Kishinev
bg|Bulgaria|Sofia
ua|Ukraine|Kyiv|Kiev
by|Belarus|Minsk
ru|Russia|Moscow
co|Colombia|Bogotá
ve|Venezuela|Caracas
ec|Ecuador|Quito
pe|Peru|Lima
gy|Guyana|Georgetown
sr|Suriname|Paramaribo
br|Brazil|Brasília
ar|Argentina|Buenos Aires
cl|Chile|Santiago|Santiago de Chile
uy|Uruguay|Montevideo
py|Paraguay|Asunción
bo|Bolivia|Sucre|La Paz|Sucre is the official capital. The government sits in La Paz.
us|the United States|Washington, D.C.|Washington
ca|Canada|Ottawa
mx|Mexico|Mexico City|Ciudad de México
gt|Guatemala|Guatemala City|Guatemala
bz|Belize|Belmopan
hn|Honduras|Tegucigalpa
sv|El Salvador|San Salvador
ni|Nicaragua|Managua
cr|Costa Rica|San José
pa|Panama|Panama City|Panama
cu|Cuba|Havana|La Habana
jm|Jamaica|Kingston
ht|Haiti|Port-au-Prince
do|the Dominican Republic|Santo Domingo
bs|the Bahamas|Nassau
kn|Saint Kitts and Nevis|Basseterre
ag|Antigua and Barbuda|Saint John's|St Johns
dm|Dominica|Roseau
lc|Saint Lucia|Castries
vc|Saint Vincent and the Grenadines|Kingstown
bb|Barbados|Bridgetown
gd|Grenada|Saint George's|St Georges
tt|Trinidad and Tobago|Port of Spain
tr|Turkey|Ankara||Officially Türkiye.
cy|Cyprus|Nicosia|Lefkosia
sy|Syria|Damascus
lb|Lebanon|Beirut
il|Israel|Jerusalem||Declared capital. Its status is disputed internationally.
ps|Palestine|Ramallah|East Jerusalem, Jerusalem|Ramallah is the administrative center. Palestine claims East Jerusalem as its capital.
jo|Jordan|Amman
iq|Iraq|Baghdad
sa|Saudi Arabia|Riyadh
ae|the United Arab Emirates|Abu Dhabi
qa|Qatar|Doha
bh|Bahrain|Manama
kw|Kuwait|Kuwait City|Kuwait
om|Oman|Muscat
ye|Yemen|Sana'a|Sanaa
ir|Iran|Tehran|Teheran
ge|Georgia|Tbilisi
am|Armenia|Yerevan
az|Azerbaijan|Baku
kz|Kazakhstan|Astana
uz|Uzbekistan|Tashkent
tm|Turkmenistan|Ashgabat
kg|Kyrgyzstan|Bishkek
tj|Tajikistan|Dushanbe
in|India|New Delhi|Delhi
pk|Pakistan|Islamabad
np|Nepal|Kathmandu
bd|Bangladesh|Dhaka|Dacca
lk|Sri Lanka|Sri Jayawardenepura Kotte|Kotte, Colombo, Sri Jayewardenepura Kotte|Colombo is the commercial center. Either answer counts.
bt|Bhutan|Thimphu|Thimbu
mv|the Maldives|Malé
af|Afghanistan|Kabul
cn|China|Beijing|Peking
jp|Japan|Tokyo
kr|South Korea|Seoul
kp|North Korea|Pyongyang
mn|Mongolia|Ulaanbaatar|Ulan Bator
tw|Taiwan|Taipei
th|Thailand|Bangkok
vn|Vietnam|Hanoi
kh|Cambodia|Phnom Penh
la|Laos|Vientiane
mm|Myanmar|Naypyidaw|Nay Pyi Taw|Also called Burma.
my|Malaysia|Kuala Lumpur||Government offices are in Putrajaya.
sg|Singapore|Singapore
id|Indonesia|Jakarta||A new capital, Nusantara, is being built.
ph|the Philippines|Manila
bn|Brunei|Bandar Seri Begawan
tl|Timor-Leste|Dili||Also called East Timor.
eg|Egypt|Cairo
ma|Morocco|Rabat
dz|Algeria|Algiers|Alger
tn|Tunisia|Tunis
ly|Libya|Tripoli
sd|Sudan|Khartoum
sn|Senegal|Dakar
mr|Mauritania|Nouakchott
gm|the Gambia|Banjul
gw|Guinea-Bissau|Bissau
gn|Guinea|Conakry
sl|Sierra Leone|Freetown
lr|Liberia|Monrovia
cv|Cape Verde|Praia||Officially Cabo Verde.
ng|Nigeria|Abuja
gh|Ghana|Accra
ci|Ivory Coast|Yamoussoukro||Officially Côte d'Ivoire. Abidjan is the largest city.
tg|Togo|Lomé
bj|Benin|Porto-Novo||The government sits in Cotonou.
bf|Burkina Faso|Ouagadougou
ml|Mali|Bamako
ne|Niger|Niamey
cm|Cameroon|Yaoundé
td|Chad|N'Djamena
cf|the Central African Republic|Bangui
gq|Equatorial Guinea|Ciudad de la Paz|Oyala|Replaced Malabo in January 2026.
ga|Gabon|Libreville
cg|the Republic of the Congo|Brazzaville
cd|the DR Congo|Kinshasa
st|São Tomé and Príncipe|São Tomé
et|Ethiopia|Addis Ababa
ke|Kenya|Nairobi
tz|Tanzania|Dodoma||Dar es Salaam is the largest city.
ug|Uganda|Kampala
rw|Rwanda|Kigali
bi|Burundi|Gitega||Replaced Bujumbura in 2019.
so|Somalia|Mogadishu
dj|Djibouti|Djibouti|Djibouti City
er|Eritrea|Asmara
ss|South Sudan|Juba
za|South Africa|Pretoria|Cape Town, Bloemfontein|Three capitals: Pretoria, Cape Town and Bloemfontein.
na|Namibia|Windhoek
bw|Botswana|Gaborone
zw|Zimbabwe|Harare
mz|Mozambique|Maputo
zm|Zambia|Lusaka
ao|Angola|Luanda
mw|Malawi|Lilongwe
ls|Lesotho|Maseru
sz|Eswatini|Mbabane|Lobamba|Formerly Swaziland. Lobamba is the royal capital.
mg|Madagascar|Antananarivo
mu|Mauritius|Port Louis
sc|the Seychelles|Victoria
km|the Comoros|Moroni
au|Australia|Canberra
nz|New Zealand|Wellington
pg|Papua New Guinea|Port Moresby
fj|Fiji|Suva
sb|the Solomon Islands|Honiara
vu|Vanuatu|Port Vila
ws|Samoa|Apia
to|Tonga|Nuku'alofa
ki|Kiribati|Tarawa|South Tarawa
tv|Tuvalu|Funafuti
nr|Naoero|Yaren||Called Nauru until July 2026. There is no official capital; the government sits in Yaren.
mh|the Marshall Islands|Majuro
fm|Micronesia|Palikir
pw|Palau|Ngerulmud
`;

const regionOf = Object.fromEntries(REGIONS.flatMap(r => r.codes.map(code => [code, r])));

export const COUNTRIES = Object.fromEntries(
  ROWS.trim().split('\n').map(row => {
    const [code, rawName, capital, alternatives, note] = row.split('|');
    const name = rawName.replace(/^the /, '');
    const region = regionOf[code];
    return [code, {
      code,
      name,
      inSentence: rawName,
      capital,
      alternatives: alternatives ? alternatives.split(',').map(s => s.trim()) : [],
      note: note ?? '',
      region: region.id,
      continent: region.continent,
    }];
  }),
);

export const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));
export const CONTINENT_BY_ID = Object.fromEntries(CONTINENTS.map(c => [c.id, c]));
export const ALL_CODES = REGIONS.flatMap(r => r.codes);

export const SIMILAR_FLAGS = [
  ['ro', 'md', 'ad', 'td', 'be'],
  ['id', 'mc', 'pl', 'sg', 'mt', 'at'],
  ['ie', 'ci', 'it', 'mx', 'hu', 'in', 'ne'],
  ['nl', 'lu', 'fr', 'ru', 'py', 'hr', 'rs', 'si', 'sk'],
  ['no', 'is', 'dk', 'se', 'fi', 'gb'],
  ['ml', 'gn', 'sn', 'cm', 'gh', 'bf', 'bj', 'cg'],
  ['au', 'nz', 'fj', 'tv', 'gb'],
  ['co', 've', 'ec', 'am'],
  ['hn', 'sv', 'ni', 'gt', 'ar', 'uy', 'gr', 'so', 'fm'],
  ['jo', 'ps', 'sd', 'ae', 'kw', 'ss'],
  ['sy', 'iq', 'ye', 'eg', 'ly'],
  ['at', 'lv', 'pe', 'lb', 'ca'],
  ['us', 'lr', 'my', 'cl', 'cu'],
  ['tr', 'tn', 'dz', 'mr', 'pk', 'az', 'uz', 'tm', 'mv'],
  ['qa', 'bh'],
  ['bg', 'hu', 'ir', 'tj'],
  ['lt', 'et', 'bo', 'gh', 'mm', 'gn'],
  ['ee', 'bw', 'sl', 'ga', 'gm'],
  ['cn', 'vn', 'ma', 'kg', 'al', 'me'],
  ['ch', 'to', 'dk', 'ge'],
  ['jp', 'bd', 'pw', 'la'],
  ['kz', 'ua', 'pw', 'se', 'ba', 'xk'],
  ['kn', 'tz', 'na', 'tt', 'bn', 'cd'],
  ['ng', 'pk', 'sa', 'tm'],
  ['ke', 'mw', 'ss', 'ly', 'af', 'sz'],
  ['th', 'cr', 'kp', 'cv', 'ls'],
  ['mz', 'zw', 'st', 'gw', 'gy', 'vu', 'za'],
  ['kh', 'la', 'tw', 'ws', 'np', 'li', 'ht'],
  ['gq', 'dj', 'km', 'bs', 'cu', 'sd', 'cz', 'ph'],
  ['dm', 'lc', 'vc', 'bb', 'gd', 'ag', 'jm', 'kn', 'bs'],
  ['sb', 'mh', 'nr', 'ki', 'tv', 'pg', 'sc', 'mu'],
  ['bz', 'sv', 'ht', 'do', 'mx', 'ec'],
  ['es', 'ad', 'mk', 'me', 'pt'],
  ['il', 'gr', 'fi', 'hn', 'so', 'cy'],
  ['br', 'za', 'mr', 'bd', 'zm', 'ao', 'mg', 'om', 'by'],
  ['sm', 'va', 'cy', 'sk', 'si', 'ar'],
  ['cf', 'sc', 'mu', 'za', 'td'],
  ['lk', 'bt', 'np', 'ws', 'al'],
  ['rw', 'ga', 'tz', 'et', 'sl', 'lk'],
  ['ug', 'bi', 'er', 'ao', 'mz', 'sr', 'ke'],
  ['sr', 'kr', 'tg', 'pa', 'jp', 'mm', 'tl', 'de', 'be'],
  ['mn', 'kg', 'am', 'ad', 'md'],
];

// Nearly identical flags, never offered as alternatives to each other.
export const INDISTINGUISHABLE_FLAGS = [['ro', 'td'], ['id', 'mc']];
