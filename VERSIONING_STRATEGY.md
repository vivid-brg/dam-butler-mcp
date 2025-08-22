# 🗂️ DAM Butler MCP - Versioning Strategy

## 📋 **File Versioning Convention**

### **Active Files (No Suffix):**
```
api/find-brand-assets.js          ← Current production version
api/mcp.js                        ← Current MCP endpoint
config/openai-prompts.js          ← Current prompts
```

### **Archived Versions:**
```
api/find-brand-assets-v1-old.js   ← Phase 1: Basic pattern matching
api/find-brand-assets-v2-old.js   ← Phase 2: Enhanced intelligence  
api/find-brand-assets-v3-old.js   ← Phase 3: When upgrading current
```

### **Phase-Based Organization:**
```
api/legacy/
├── phase1/
│   ├── find-brand-assets-basic.js
│   └── mcp-simple.js
├── phase2/
│   ├── find-brand-assets-enhanced.js
│   └── openai-prompts-v1.js
└── phase3/
    ├── find-brand-assets-intelligence.js
    └── advanced-features.js
```

## 🔄 **Version Management Workflow**

### **When Creating New Version:**
```bash
# 1. Archive current version
mv api/find-brand-assets.js api/find-brand-assets-v2-old.js

# 2. Deploy new version
cp api/find-brand-assets-new.js api/find-brand-assets.js

# 3. Update imports if needed
# 4. Test thoroughly
# 5. Commit with version tag
git tag v3.0.0
```

### **Import Management:**
```javascript
// ✅ Always import from canonical names
import findBrandAssets from './find-brand-assets.js';  // Current
import { analytics } from './analytics.js';           // Current

// ❌ Never import versioned files directly
import oldAssets from './find-brand-assets-v1-old.js'; // NO
```

## 📦 **Package.json Version Tracking**

```json
{
  "version": "3.0.0",
  "phases": {
    "phase1": "1.0.0 - Basic pattern matching",
    "phase2": "2.0.0 - OpenAI intelligence integration", 
    "phase3": "3.0.0 - Enterprise platform with analytics + advanced AI"
  }
}
```

## 🚀 **Deployment Safety**

### **Blue-Green Deployment:**
```javascript
// config/deployment.js
export const ACTIVE_ENDPOINTS = {
  asset_search: 'find-brand-assets.js',     // Current
  mcp_server: 'mcp.js',                     // Current  
  analytics: 'analytics.js',                // Phase 3A
  brandfolder: 'brandfolder-enhanced.js',   // Phase 3B
  advanced_ai: 'advanced-intelligence.js'   // Phase 3C
};

// For rollback capability
export const FALLBACK_ENDPOINTS = {
  asset_search: 'find-brand-assets-v2-old.js',
  mcp_server: 'mcp-simple-v1.js'
};
```

## 🏷️ **Git Tagging Strategy**

```bash
# Phase releases
git tag v1.0.0 -m "Phase 1: Basic DAM Butler"
git tag v2.0.0 -m "Phase 2: OpenAI Intelligence" 
git tag v3.0.0 -m "Phase 3: Enterprise Platform"

# Feature releases  
git tag v3.1.0 -m "Phase 3A: Analytics Dashboard"
git tag v3.2.0 -m "Phase 3B: Live Brandfolder Integration"
git tag v3.3.0 -m "Phase 3C: Advanced AI Features"
```

## 📁 **Recommended File Organization**

```
dam-butler-mcp/
├── api/
│   ├── find-brand-assets.js        ← CURRENT (Phase 3)
│   ├── analytics.js                ← CURRENT (Phase 3A)
│   ├── brandfolder-enhanced.js     ← CURRENT (Phase 3B) 
│   └── legacy/
│       ├── find-brand-assets-v1-old.js
│       └── find-brand-assets-v2-old.js
├── config/
│   ├── openai-prompts.js           ← CURRENT (Phase 2+)
│   ├── advanced-intelligence.js    ← CURRENT (Phase 3C)
│   └── legacy/
│       └── basic-config-v1.js
└── docs/
    ├── VERSIONING_STRATEGY.md
    ├── PHASE_HISTORY.md
    └── MIGRATION_GUIDES.md
```

---

*Generated for DAM Butler MCP Phase 3 - Enterprise Platform*
