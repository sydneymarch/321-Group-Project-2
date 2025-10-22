# 🐟 Advanced Species Search & Validation System

## Overview
The SeaTrue platform now features an intelligent species search system that:
1. **Searches local database first** by common name only
2. **Auto-searches GBIF** if species not found
3. **Validates with IUCN Red List** for conservation status
4. **Auto-adds to database** for future use
5. **Shows only common names** (user-friendly)

---

## 🔍 How It Works

### **Step 1: User Types Species Name**
```
Fisher types: "barracuda"
```

### **Step 2: Search Local Database**
```javascript
// Search database for common name match
const localMatches = speciesData.filter(sp => 
    sp.name.toLowerCase().includes(query.toLowerCase())
);
```

**If found in database:**
```
✓ Great Barracuda
  • Max: 72" / 110 lbs
  ✓ In Database
  LC (Least Concern)
```

### **Step 3: If Not Found → Search GBIF**
```javascript
// Query GBIF global database
const response = await fetch(
    `https://api.gbif.org/v1/species/search?q=barracuda&class=Actinopterygii`
);
```

**Shows loading message:**
```
🔍 Not in database, searching global species database...
```

### **Step 4: Get Common Name from GBIF**
```javascript
// Get vernacular (common) names for species
const vernacularName = await getCommonNameFromGBIF(speciesKey, query);

// Prioritize English names matching search query
// Priority: exact match → starts with → contains
```

**Example Result:**
- Scientific: *Sphyraena barracuda*
- English common names: "Great Barracuda", "Giant Barracuda", "Barracuda"
- Best match: "Great Barracuda" (contains "barracuda")

### **Step 5: Get IUCN Conservation Status**
```javascript
// Query IUCN Red List API
const response = await fetch(
    `https://apiv3.iucnredlist.org/api/v3/species/Sphyraena barracuda?token=...`
);
```

**IUCN Categories:**
- **LC** = Least Concern (Green)
- **NT** = Near Threatened (Blue)
- **VU** = Vulnerable (Yellow)
- **EN** = Endangered (Orange)
- **CR** = Critically Endangered (Red)
- **EW** = Extinct in Wild (Gray)
- **EX** = Extinct (Black)
- **DD** = Data Deficient (Gray)

### **Step 6: Get Size Data from FishBase**
```javascript
// Get species size/weight data
const response = await fetch(
    `https://fishbase.ropensci.org/species?sciname=Sphyraena barracuda`
);
// Returns: MaxLength (cm), Weight (g)
// Convert to: inches, lbs
```

### **Step 7: Display Results**
```
Great Barracuda
• Max: 72" / 110 lbs
Will be added | LC
```

### **Step 8: User Selects → Auto-Add to Database**
```javascript
// Add species to database with all data
await fetch('/api/SeaTrue/species/add', {
    method: 'POST',
    body: JSON.stringify({
        commonName: "Great Barracuda",
        scientificName: "Sphyraena barracuda",
        conservationStatus: "LC",
        minLength: null,
        maxLength: 72.0,
        avgWeight: 110.0
    })
});

// Show notification
"Great Barracuda added to database (LC)"
```

### **Step 9: Next Time → Instant Result**
```
Fisher types: "barra"
  ↓
Database: ✓ Great Barracuda found instantly
  ↓
No GBIF/IUCN calls needed!
```

---

## 🎨 User Interface

### **Autocomplete Dropdown - Database Match:**
```
┌─────────────────────────────────────┐
│ Yellowfin Tuna                      │
│ • Max: 94" / 440 lbs                │
│ ✓ In Database  LC                   │
└─────────────────────────────────────┘
```

### **Autocomplete Dropdown - GBIF Match:**
```
┌─────────────────────────────────────┐
│ 🔍 Not in database, searching...    │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Bluefin Tuna                        │
│ • Max: 118" / 1500 lbs              │
│ Will be added  EN                   │
└─────────────────────────────────────┘
```

### **Conservation Badge Colors:**
- 🟢 **LC** (Least Concern) - Green
- 🔵 **NT** (Near Threatened) - Blue  
- 🟡 **VU** (Vulnerable) - Yellow
- 🟠 **EN** (Endangered) - Orange
- 🔴 **CR** (Critically Endangered) - Red
- ⚫ **EX** (Extinct) - Black

---

## 📊 API Flow

### **1. Search Database**
```http
GET /api/SeaTrue/species/all

Response:
[
  {
    "commonName": "Yellowfin Tuna",
    "scientificName": "Thunnus albacares",
    "conservationStatus": "LC",
    "maxLength": 94.0,
    "avgWeight": 440.0
  }
]
```

### **2. Search GBIF (if not in database)**
```http
GET https://api.gbif.org/v1/species/search?q=bluefin&class=Actinopterygii

Response:
{
  "results": [
    {
      "key": 2345678,
      "scientificName": "Thunnus thynnus",
      "canonicalName": "Thunnus thynnus"
    }
  ]
}
```

### **3. Get Vernacular Names**
```http
GET https://api.gbif.org/v1/species/2345678/vernacularNames

Response:
{
  "results": [
    {
      "vernacularName": "Atlantic Bluefin Tuna",
      "language": "eng"
    },
    {
      "vernacularName": "Bluefin Tuna",
      "language": "eng"
    }
  ]
}
```

### **4. Get IUCN Status**
```http
GET https://apiv3.iucnredlist.org/api/v3/species/Thunnus thynnus?token=...

Response:
{
  "result": [
    {
      "category": "EN",
      "scientific_name": "Thunnus thynnus"
    }
  ]
}
```

### **5. Get FishBase Data**
```http
GET https://fishbase.ropensci.org/species?sciname=Thunnus thynnus&fields=Length,Weight

Response:
{
  "data": [
    {
      "Length": 300.0,  // cm
      "Weight": 680000  // grams
    }
  ]
}
```

### **6. Add to Database**
```http
POST /api/SeaTrue/species/add

Request:
{
  "commonName": "Atlantic Bluefin Tuna",
  "scientificName": "Thunnus thynnus",
  "conservationStatus": "EN",
  "minLength": null,
  "maxLength": 118.0,  // converted to inches
  "avgWeight": 1500.0  // converted to lbs
}

Response:
{
  "message": "Species added successfully"
}
```

---

## 🔒 Validation & Quality Control

### **1. Fish-Only Validation**
```javascript
// Only searches Class: Actinopterygii (ray-finned fish)
class=Actinopterygii
```
**Result**: Can't add sharks, whales, or other non-fish species

### **2. Common Name Priority**
```javascript
// Search order:
1. Exact match to query
2. Starts with query
3. Contains query
4. First English name
5. Any vernacular name
```
**Result**: User-friendly names, not scientific jargon

### **3. Duplicate Prevention**
```javascript
// Check before adding
SELECT COUNT(*) FROM Species 
WHERE LOWER(CommonName) = LOWER(@commonName) 
   OR LOWER(ScientificName) = LOWER(@scientificName)
```
**Result**: No duplicate species in database

### **4. Conservation Awareness**
```javascript
// Show IUCN status
if (status === 'EN' || status === 'CR') {
    displayWarning("This species is endangered!");
}
```
**Result**: Users aware of threatened species

---

## 💡 User Experience Benefits

### **For Fisher:**
1. **Type common names** → "tuna" not "Thunnus albacares"
2. **Instant results** for known species
3. **Auto-discovery** of new species
4. **See conservation status** before catching
5. **Size guidance** shows if catch is normal

### **For Platform:**
1. **Growing database** → Every new search adds species
2. **Quality data** → GBIF + IUCN + FishBase validated
3. **No manual entry** → Automatic species addition
4. **Conservation tracking** → Know which species are threatened

---

## 🧪 Example Scenarios

### **Scenario 1: Common Fish in Database**
```
User types: "cod"
  ↓
Database: ✓ Atlantic Cod (instant)
  ↓
Display: Atlantic Cod • Max: 51" / 55 lbs | ✓ In Database | VU
```

### **Scenario 2: Uncommon Fish (Not in DB)**
```
User types: "opah"
  ↓
Database: No match
  ↓
GBIF: Searching... Found "Opah" (Lampris guttatus)
  ↓
IUCN: Least Concern (LC)
  ↓
FishBase: Max: 79" / 600 lbs
  ↓
Display: Opah • Max: 79" / 600 lbs | Will be added | LC
  ↓
User selects
  ↓
Added to database!
  ↓
Next fisher types "opah" → Instant result from DB
```

### **Scenario 3: Endangered Species**
```
User types: "bluefin tuna"
  ↓
GBIF: Atlantic Bluefin Tuna
  ↓
IUCN: Endangered (EN)
  ↓
Display: Atlantic Bluefin Tuna • Max: 118" / 1500 lbs | Will be added | EN ⚠️
  ↓
Alert: "This species is endangered. Please ensure compliance with regulations."
```

---

## 🛠️ Technical Implementation

### **Frontend (fisher.js):**
```javascript
// 1. Initialize autocomplete
initializeSpeciesAutocomplete()

// 2. Search on input (debounced 300ms)
speciesInput.addEventListener('input', () => {
    setTimeout(() => searchSpecies(query), 300);
});

// 3. Search database first
const localMatches = speciesData.filter(sp => 
    sp.name.toLowerCase().includes(query.toLowerCase())
);

// 4. If not found, search GBIF
if (localMatches.length === 0) {
    const gbifResults = await searchGBIFByCommonName(query);
}

// 5. Display with conservation badges
displayAutocompleteResults(results);

// 6. On select, add to database if from GBIF
if (species.source === 'gbif') {
    await addSpeciesToDatabase(species);
}
```

### **Backend (SeaTrueController.cs):**
```csharp
// 1. Get all species with conservation status
[HttpGet("species/all")]
public async Task<ActionResult> GetAllSpecies()
{
    // Returns: CommonName, ScientificName, ConservationStatus, 
    //          MinLength, MaxLength, AvgWeight
}

// 2. Add new species from GBIF
[HttpPost("species/add")]
public async Task<IActionResult> AddSpecies(AddSpeciesRequest request)
{
    // Check if exists
    // Insert with conservation status
    // Return success
}
```

### **Database Schema:**
```sql
-- Species table includes:
CREATE TABLE Species (
    SpeciesID INTEGER PRIMARY KEY,
    CommonName VARCHAR(200) NOT NULL,
    ScientificName VARCHAR(200),
    ConservationStatus VARCHAR(50),      -- NEW
    IUCNRedListStatus VARCHAR(50),        -- NEW
    MinLength DECIMAL(8,2),               -- NEW
    MaxLength DECIMAL(8,2),               -- NEW
    AvgWeight DECIMAL(8,2)                -- NEW
);
```

---

## 📈 Data Flow Summary

```
User Input → Database Search → Found? → Display
                     ↓
                   Not Found
                     ↓
              GBIF Search (fish only)
                     ↓
           Get Vernacular Names
                     ↓
            Get IUCN Status
                     ↓
          Get FishBase Size Data
                     ↓
              Display Results
                     ↓
            User Selects
                     ↓
         Add to Database
                     ↓
    Show Success Notification
                     ↓
         Next Search → Found in DB!
```

---

## 🌟 Key Features

### **1. Common Name Search Only**
- ✅ User types: "tuna"
- ❌ NOT: "Thunnus albacares"
- **Why**: Nobody knows scientific names

### **2. GBIF Vernacular Name Matching**
- ✅ Matches common names from GBIF
- ✅ Prioritizes English names
- ✅ Finds best match to query
- **Why**: User-friendly species discovery

### **3. IUCN Conservation Status**
- ✅ Shows threat level (LC, EN, CR, etc.)
- ✅ Color-coded badges
- ✅ Helps with compliance
- **Why**: Conservation awareness

### **4. Auto-Growing Database**
- ✅ Every GBIF search adds species
- ✅ Future searches are instant
- ✅ No manual data entry needed
- **Why**: Database improves over time

### **5. Size Validation**
- ✅ Warns if catch is unusual
- ✅ Uses FishBase data
- ✅ Prevents fraud
- **Why**: Data quality assurance

---

## 🚀 Testing

### **Test 1: Database Species**
1. Type "yellow"
2. See "Yellowfin Tuna" instantly
3. Shows size data and "✓ In Database"

### **Test 2: New Species**
1. Type "barracuda" (if not in DB)
2. See "Searching global database..."
3. Results show "Will be added"
4. Select → See notification "Added to database"
5. Type "barra" again → Instant result!

### **Test 3: Conservation Status**
1. Type "bluefin"
2. See "EN" (Endangered) badge in orange
3. System aware of threatened species

### **Test 4: Only Common Names Shown**
1. Type any fish name
2. Results show ONLY common names
3. No scientific names in dropdown
4. User-friendly display

---

## 🎯 Summary

**What Changed:**
- ✅ Search by **common names only** (no scientific names shown)
- ✅ **Database search first** (instant results)
- ✅ **GBIF search** if not found (global discovery)
- ✅ **IUCN integration** (conservation status)
- ✅ **Auto-add to database** (self-improving system)
- ✅ **FishBase size data** (validation support)

**Result:**
- 🐟 Can add **ANY fish species** in the world
- 🌍 User types **common names** (not scientific)
- 🔍 System validates with **GBIF** (real fish only)
- 🦈 Shows **IUCN status** (conservation awareness)
- 📊 Gets **size data** from FishBase
- 💾 Auto-adds to **database** for future
- ⚡ Next search is **instant** (no API calls)

**Impact:**
- **Fishers**: Easy species entry, no scientific knowledge needed
- **Platform**: Self-growing database, quality data
- **Conservation**: Awareness of threatened species
- **Enterprise**: Scalable, global, validated species system

