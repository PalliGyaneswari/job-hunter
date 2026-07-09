export default function TabNav({ tabs, activeTab, onTabChange, stats }) {
  const tabCounts = {
    all:          stats?.total_active    || 0,
    priority:     stats?.total_priority  || 0,
    applications: stats?.total_applied   || 0,
    closed:       stats?.total_closed    || 0,
  }

  return (
    <div className="flex items-center gap-1 border-b border-vault-border mb-5 overflow-x-auto pb-0 no-scrollbar">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        const count = tabCounts[tab.id]
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              isActive
                ? 'text-vault-brass tab-active'
                : 'text-vault-text-dim hover:text-vault-text-muted'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {count > 0 && (
              <span className={`mono text-xs px-1.5 py-0.5 rounded-md ${
                isActive
                  ? 'bg-vault-brass/20 text-vault-brass'
                  : 'bg-vault-border text-vault-text-dim'
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
