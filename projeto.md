---

# 🎨 Design System

O projeto seguirá um Design System próprio, inspirado em aplicações modernas como:

- Google Material Design 3
- Notion
- Todoist
- TickTick
- Google Fit
- Samsung Health

Objetivos:

- Interface limpa
- Componentes reutilizáveis
- Padronização visual
- Escalabilidade
- Facilidade de manutenção

---

# 📱 Design Responsivo

O aplicativo será desenvolvido utilizando princípios de Responsive Design para diferentes tamanhos de tela.

Suporte para:

- Smartphones pequenos
- Smartphones médios
- Smartphones grandes
- Tablets (futuramente)
- Foldables (futuramente)

Boas práticas:

- Flexbox
- Safe Area
- Escalas responsivas
- Fontes adaptáveis
- Espaçamentos padronizados
- Componentes reutilizáveis

Bibliotecas recomendadas:

- react-native-safe-area-context
- react-native-size-matters
- react-native-responsive-screen

---

# 🎭 Biblioteca de Ícones

Será utilizada a biblioteca:

## Lucide React Native & Vector Icons

Vantagens

- Moderna
- Open Source
- Muito utilizada
- SVG
- Personalização simples
- Excelente integração com React Native

Exemplos

- Home
- Bell
- Dumbbell
- Droplets
- Calendar
- User
- Settings
- Moon
- Sun
- Heart
- Clock
- Target

Também utilizaremos:

- @expo/vector-icons

Como fallback para ícones específicos.

---

# 🎨 Tema

O aplicativo possuirá suporte completo para:

- Light Theme
- Dark Theme
- Tema automático do sistema

As cores serão centralizadas em um arquivo:

```

src/constants/theme.ts

```

Exemplo:

```

Primary
Secondary
Success
Warning
Danger
Info
Background
Surface
Text
Border

```

---

# 🧩 Biblioteca de Componentes

Todos os componentes serão reutilizáveis.

Estrutura:

```

src/components

Button/
Card/
Input/
Modal/
Header/
Avatar/
Icon/
List/
Badge/
Progress/
BottomSheet/
FAB/
Switch/
Checkbox/
Radio/
Toast/
Loading/
Empty/
Charts/

```

---

# ✨ Animações

Bibliotecas:

- React Native Reanimated
- React Native Gesture Handler

Animações previstas:

- Fade
- Slide
- Scale
- Bottom Sheet
- Pull to Refresh
- Swipe Actions
- Floating Action Button
- Animated Cards

---

# 📐 Grid e Espaçamentos

Sistema baseado em múltiplos de 4.

```

4
8
12
16
20
24
32
40
48
64

```

Todos os componentes seguirão esse padrão.

---

# 🖋 Tipografia

Fonte principal

Inter

Pesos:

- Regular
- Medium
- SemiBold
- Bold

Hierarquia

- Display
- H1
- H2
- H3
- Title
- Subtitle
- Body
- Caption
- Label

---

# 🎨 Paleta de Cores

Exemplo inicial

Primary

#2563EB

Success

#22C55E

Danger

#EF4444

Warning

#F59E0B

Background

#FFFFFF

Surface

#F8FAFC

Dark Background

#0F172A

Dark Surface

#1E293B

Text

#111827

Dark Text

#F9FAFB

---

# 📦 Bibliotecas do Projeto

## Core

- React Native
- Expo
- TypeScript

## Navegação

- Expo Router

## Estado Global

- Zustand

## Banco de Dados

- SQLite (`expo-sqlite`)

## Formulários & Validação

- React Hook Form
- Zod

## Notificações Locais & Canais

- Expo Notifications (`expo-notifications`)

## Armazenamento Criptografado

- Expo Secure Store (`expo-secure-store`)

## Ícones & Gráficos

- @expo/vector-icons
- react-native-svg

## Animações

- react-native-reanimated
- react-native-gesture-handler

---

# 🏗 Arquitetura Visual

Seguiremos o conceito de Atomic Design.

```

Screens

↓

Templates

↓

Organisms

↓

Molecules

↓

Atoms

```

---

# ✅ Status de Implementação das Funcionalidades

| Módulo / Funcionalidade | Arquivo(s) de Implementação | Status |
|---|---|---|
| 💧 **Contador de Água Interativo** | [WaterCounterModal/index.tsx](file:///c:/projetosmobile/LifeRoutine/src/components/organisms/WaterCounterModal/index.tsx) | **CONCLUÍDO (100%)** |
| 🌙 **Contador Deslizante de Meia-Lua** | [ArcSliderCounter/index.tsx](file:///c:/projetosmobile/LifeRoutine/src/components/molecules/ArcSliderCounter/index.tsx) | **CONCLUÍDO (100%)** |
| ⚡ **Temporizador de Treino Xiaomi SVG** | [ExerciseTimerModal/index.tsx](file:///c:/projetosmobile/LifeRoutine/src/components/organisms/ExerciseTimerModal/index.tsx) | **CONCLUÍDO (100%)** |
| 🔲 **Modal de Contador Genérico** | [GenericHabitCounterModal/index.tsx](file:///c:/projetosmobile/LifeRoutine/src/components/organisms/GenericHabitCounterModal/index.tsx) | **CONCLUÍDO (100%)** |
| ✏️ **Edição de Metas & Hábitos** | [EditTargetModal/index.tsx](file:///c:/projetosmobile/LifeRoutine/src/components/molecules/EditTargetModal/index.tsx) | **CONCLUÍDO (100%)** |
| 🔔 **Notificações & Canais Locais** | [notifications.ts](file:///c:/projetosmobile/LifeRoutine/src/services/notifications.ts) | **CONCLUÍDO (100%)** |
| 🔒 **Armazenamento Seguro de Perfil** | [storage.ts](file:///c:/projetosmobile/LifeRoutine/src/services/storage.ts) | **CONCLUÍDO (100%)** |
| 🔐 **Autenticação, Cadastro & Redefinição** | [auth.ts](file:///c:/projetosmobile/LifeRoutine/src/services/auth.ts) e [login.tsx](file:///c:/projetosmobile/LifeRoutine/src/app/login.tsx) | **CONCLUÍDO (100%)** |
| 🟩 **Heatmap de Consistência Mensal** | [HeatmapCalendar/index.tsx](file:///c:/projetosmobile/LifeRoutine/src/components/molecules/HeatmapCalendar/index.tsx) | **CONCLUÍDO (100%)** |
| 🗓️ **Navegação Horizontal por Calendário** | [DateStripSelector/index.tsx](file:///c:/projetosmobile/LifeRoutine/src/components/molecules/DateStripSelector/index.tsx) | **CONCLUÍDO (100%)** |
| 🏆 **Sistema de Conquistas & Medalhas** | [BadgesSection/index.tsx](file:///c:/projetosmobile/LifeRoutine/src/components/molecules/BadgesSection/index.tsx) | **CONCLUÍDO (100%)** |
| 📤 **Relatórios & Backup JSON** | [export.ts](file:///c:/projetosmobile/LifeRoutine/src/services/export.ts) | **CONCLUÍDO (100%)** |
| 💾 **Banco de Dados Relacional** | [database.ts](file:///c:/projetosmobile/LifeRoutine/src/services/database.ts) | **CONCLUÍDO (100%)** |
