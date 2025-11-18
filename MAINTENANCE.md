# 🔧 Guida Manutenzione e Best Practices

Questa guida ti aiuta a mantenere, estendere e debuggare **Timecard Pro** nel tempo.

---

## 📋 Indice
1. [Workflow Sviluppo](#workflow-sviluppo)
2. [Aggiungere Nuove Feature](#aggiungere-nuove-feature)
3. [Debugging](#debugging)
4. [Database Migrations](#database-migrations)
5. [Monitoring Produzione](#monitoring-produzione)
6. [Best Practices](#best-practices)

---

## Workflow Sviluppo

### 🔄 Feature Branch Flow

```bash
# 1. Crea branch per nuova feature
git checkout -b feature/nome-feature

# 2. Sviluppa in locale
npm run dev

# 3. Test build produzione
npm run build
npm run preview

# 4. Commit changes
git add .
git commit -m "feat: descrizione feature"

# 5. Push e crea Pull Request
git push origin feature/nome-feature
# Su GitHub: crea PR verso main

# 6. Review e merge
# Vercel farà auto-deploy su main
```

### 🔍 Type Checking

**Prima di ogni commit**:
```bash
npm run type-check
# Risolvi tutti gli errori TypeScript
```

**Configurazione TSConfig**:
- `strict: true` → Type safety massimo
- `noUnusedLocals: true` → Rileva variabili inutilizzate
- `noUnusedParameters: true` → Rileva parametri inutilizzati

---

## Aggiungere Nuove Feature

### ➕ Nuovo Widget Dashboard

**1. Crea componente in `src/components/`**:
```tsx
// src/components/NewWidget.tsx
import React from 'react';

interface NewWidgetProps {
  data: any;
  onAction?: () => void;
}

const NewWidget: React.FC<NewWidgetProps> = ({ data, onAction }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Nuovo Widget</h3>
      {/* ... contenuto ... */}
    </div>
  );
};

export default NewWidget;
```

**2. Aggiungi a `DashboardPage.tsx`**:
```tsx
import NewWidget from '../components/NewWidget';

// Nel render:
{widgetVisibility.newWidget && (
  <NewWidget data={someData} onAction={handleAction} />
)}
```

**3. Aggiungi toggle in `SettingsPage.tsx`**:
```tsx
<label className="flex items-center justify-between">
  <span>Nuovo Widget</span>
  <input
    type="checkbox"
    checked={widgetVisibility.newWidget}
    onChange={(e) => handleWidgetToggle('newWidget', e.target.checked)}
  />
</label>
```

**4. Aggiungi al type `WidgetVisibility` in `types.ts`**:
```typescript
export interface WidgetVisibility {
  // ... existing ...
  newWidget: boolean;
}
```

---

### 🗄️ Nuova Tabella Database

**1. Crea migration SQL**:
```sql
-- Aggiungi a database_schema.sql oppure crea nuovo file

CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indice performance
CREATE INDEX idx_new_table_user ON new_table(user_id);

-- RLS Policy
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own new_table" ON new_table
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own new_table" ON new_table
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_new_table_updated_at
    BEFORE UPDATE ON new_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**2. Esegui in Supabase SQL Editor**

**3. Aggiungi type in `types.ts`**:
```typescript
export interface NewTableEntry {
  id: string;
  user_id: string;
  data: any;
  created_at: string;
  updated_at: string;
}
```

**4. CRUD operations in `App.tsx`**:
```typescript
// Fetch
const { data, error } = await supabase
  .from('new_table')
  .select('*')
  .order('created_at', { ascending: false });

// Insert
const { data, error } = await supabase
  .from('new_table')
  .insert({ data: { /* ... */ } })
  .select()
  .single();

// Update
const { error } = await supabase
  .from('new_table')
  .update({ data: { /* ... */ } })
  .eq('id', entryId);

// Delete
const { error } = await supabase
  .from('new_table')
  .delete()
  .eq('id', entryId);
```

---

### 📱 Nuova Pagina

**1. Crea file in `src/pages/`**:
```tsx
// src/pages/NewPage.tsx
import React from 'react';

interface NewPageProps {
  // ... props ...
}

const NewPage: React.FC<NewPageProps> = (props) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Nuova Pagina</h1>
      {/* ... contenuto ... */}
    </div>
  );
};

export default NewPage;
```

**2. Aggiungi route in `App.tsx`**:
```tsx
import NewPage from './pages/NewPage';

type Page = 'dashboard' | 'calendar' | 'settings' | 'balances' | 'new-page';

// Nel render:
{currentPage === 'new-page' && <NewPage {...props} />}
```

**3. Aggiungi link in `Header.tsx`**:
```tsx
<button
  onClick={() => setCurrentPage('new-page')}
  className={`px-3 py-2 rounded-md ${
    currentPage === 'new-page' 
      ? 'bg-indigo-100 dark:bg-indigo-900' 
      : ''
  }`}
>
  🆕 Nuova Pagina
</button>
```

---

## Debugging

### 🐛 Errori Comuni e Soluzioni

#### "Cannot read property 'map' of undefined"
**Causa**: Dati non ancora caricati

**Fix**: Aggiungi conditional rendering
```tsx
{data?.length > 0 && data.map(item => (...))}
```

#### "Hydration failed"
**Causa**: HTML server-side != HTML client-side

**Fix**: Rimuovi logica dipendente da `window` nel render iniziale
```tsx
const [isMounted, setIsMounted] = useState(false);
useEffect(() => setIsMounted(true), []);

if (!isMounted) return <Loading />;
```

#### "Maximum update depth exceeded"
**Causa**: useEffect senza dependencies corrette

**Fix**: Aggiungi array dipendenze
```tsx
useEffect(() => {
  fetchData();
}, [dependency1, dependency2]); // ← IMPORTANTE
```

#### "Supabase: session not found"
**Causa**: JWT token scaduto o URL non configurato

**Fix**:
1. Verifica Site URL in Supabase → Authentication → URL Configuration
2. Forza logout/login per refresh token

### 🔍 Console per Debug

**Solo in development**:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG]', variabile);
}
```

**Produzione**: Tutti i `console.*` vengono automaticamente rimossi da Terser.

### 🧪 Testing Manuale

**Checklist pre-deploy**:
- [ ] Registrazione nuovo utente
- [ ] Login utente esistente
- [ ] Timbratura entrata → verifica DB
- [ ] Timbratura uscita → calcolo ore corretto
- [ ] Aggiunta permesso → preview saldo corretto
- [ ] Import PDF → timbrature estratte
- [ ] Dark mode toggle → stili corretti
- [ ] Responsive: Mobile 375px, Tablet 768px, Desktop 1920px
- [ ] Ricarica pagina → dati persistiti

---

## Database Migrations

### 📊 Schema Changes

**Workflow**:

1. **Backup database** (importante!)
   ```bash
   # Su Supabase Dashboard:
   # Project → Database → Backups → Create Backup
   ```

2. **Test su branch Supabase** (se disponibile):
   ```sql
   -- Crea preview branch per test
   ```

3. **Esegui migration su produzione**:
   ```sql
   -- Esempio: aggiungere colonna
   ALTER TABLE time_logs ADD COLUMN location TEXT;
   
   -- Aggiungere indice
   CREATE INDEX idx_time_logs_location ON time_logs(location);
   ```

4. **Update TypeScript types**:
   ```typescript
   export interface TimeLog {
     // ... existing ...
     location?: string; // ← Nuovo campo
   }
   ```

5. **Deploy codice aggiornato**:
   ```bash
   git push origin main
   ```

### ⚠️ Breaking Changes

Se la migration richiede **data transformation**:

```sql
-- 1. Aggiungi nuova colonna
ALTER TABLE users ADD COLUMN full_name TEXT;

-- 2. Popola con dati esistenti
UPDATE users SET full_name = first_name || ' ' || last_name;

-- 3. (Opzionale) Rimuovi vecchie colonne dopo conferma
-- ALTER TABLE users DROP COLUMN first_name, DROP COLUMN last_name;
```

**Strategia zero-downtime**:
1. Deploy codice che supporta **entrambe** le versioni (old + new columns)
2. Esegui migration database
3. Verifica che tutto funzioni
4. Deploy codice che usa solo new columns
5. Rimuovi old columns

---

## Monitoring Produzione

### 📈 Metriche da Monitorare

#### Vercel Dashboard
- **Deployments**: Stato ultimo deploy
- **Functions**: Errori edge functions
- **Analytics**: Visite, bounce rate, page views
- **Performance**: Core Web Vitals (LCP, FID, CLS)

#### Supabase Dashboard
- **Database → Tables**: Numero righe per tabella
- **Database → Query Performance**: Query lente (>100ms)
- **Auth → Users**: Utenti registrati, ultimo login
- **API → Logs**: Errori API, rate limits

### 🚨 Alert Setup (Opzionali)

**Vercel**:
- Deploy failed → Email notification
- Performance degradation → Slack notification

**Supabase**:
- Database size > 80% → Email alert
- API requests > 10k/min → Webhook alert

---

## Best Practices

### ✅ Code Style

#### Component Structure
```tsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// 2. Types/Interfaces
interface MyComponentProps {
  data: any;
  onAction: () => void;
}

// 3. Component
const MyComponent: React.FC<MyComponentProps> = ({ data, onAction }) => {
  // 4. State
  const [loading, setLoading] = useState(false);
  
  // 5. Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  // 6. Handlers
  const handleClick = () => {
    onAction();
  };
  
  // 7. Render
  return <div>...</div>;
};

// 8. Export
export default MyComponent;
```

#### Naming Conventions
- **Components**: PascalCase (`MyComponent.tsx`)
- **Variables**: camelCase (`myVariable`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types**: PascalCase (`MyType`)
- **Functions**: camelCase (`handleClick`)

### 🎨 Styling

**Tailwind Patterns**:
```tsx
// ✅ DO: Classi ordinate per categoria
<div className="
  flex items-center justify-between      // Layout
  px-4 py-2                              // Spacing
  bg-white dark:bg-gray-800              // Colors
  rounded-lg shadow-md                   // Appearance
  hover:shadow-lg transition-shadow      // Interactions
">

// ❌ DON'T: Stili inline (evitare)
<div style={{ padding: '8px', backgroundColor: 'white' }}>
```

### 🔐 Sicurezza

**Environment Variables**:
```typescript
// ✅ DO: Usa variabili ambiente
const apiKey = import.meta.env.VITE_API_KEY;

// ❌ DON'T: Hardcode secrets
const apiKey = 'sk_live_abc123...';
```

**Supabase Queries**:
```typescript
// ✅ DO: Usa RLS, filtra su server
const { data } = await supabase
  .from('time_logs')
  .select('*')
  .eq('user_id', userId); // ← RLS lo fa automaticamente

// ❌ DON'T: Filtra su client (inefficiente + insicuro)
const { data } = await supabase.from('time_logs').select('*');
const filtered = data.filter(log => log.user_id === userId);
```

### ⚡ Performance

**Memoization**:
```tsx
// ✅ DO: Memoizza calcoli pesanti
const totalHours = useMemo(() => {
  return logs.reduce((sum, log) => sum + log.hours, 0);
}, [logs]);

// ❌ DON'T: Calcola ad ogni render
const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
```

**Lazy Loading**:
```tsx
// ✅ DO: Lazy load componenti pesanti
const HeavyChart = React.lazy(() => import('./HeavyChart'));

<Suspense fallback={<Loading />}>
  <HeavyChart />
</Suspense>
```

---

## 📚 Risorse Utili

- **React DevTools**: Debug component state/props
- **Supabase Studio**: SQL editor + database explorer
- **Vercel Logs**: Real-time deployment logs
- **Chrome DevTools**: Network tab per API calls
- **TypeScript Playground**: Test TypeScript syntax

---

## 🆘 Supporto

**Problemi comuni**:
1. Controlla `IMPROVEMENTS_REPORT.md` per soluzioni note
2. Verifica `DEPLOYMENT.md` troubleshooting section
3. Consulta `ARCHITECTURE.md` per comprendere data flow

**Community**:
- [Supabase Discord](https://discord.supabase.com)
- [React Community](https://react.dev/community)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**Ultima revisione**: ${new Date().toLocaleDateString('it-IT')}  
**Versione**: 1.0.0
