import React from 'react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-danger">Admin Control Panel</h1>
        <p className="text-foreground/70">Manage users, brokers, and system logs.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30">
          <h2 className="text-xl font-semibold mb-4 text-primary">User Management</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-secondary">
                <th className="pb-2 text-foreground/70 font-medium">Email</th>
                <th className="pb-2 text-foreground/70 font-medium">Role</th>
                <th className="pb-2 text-foreground/70 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-secondary/30">
                <td className="py-3">admin@ssgobind.space</td>
                <td className="py-3 text-danger">Admin</td>
                <td className="py-3 text-accent">Active</td>
              </tr>
              <tr className="border-b border-secondary/30">
                <td className="py-3">user1@gmail.com</td>
                <td className="py-3 text-primary">User</td>
                <td className="py-3 text-accent">Active</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6 rounded-xl border border-secondary bg-secondary/30">
          <h2 className="text-xl font-semibold mb-4 text-primary">Broker Configuration</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-background/50 p-3 rounded border border-secondary/50">
              <span className="font-mono">Zerodha Kite Connect</span>
              <button className="bg-primary hover:bg-primary/80 text-white px-3 py-1 rounded text-sm transition-colors">Configure</button>
            </div>
            <div className="flex justify-between items-center bg-background/50 p-3 rounded border border-secondary/50">
              <span className="font-mono text-foreground/50">Upstox (Coming Soon)</span>
              <button disabled className="bg-secondary/50 text-foreground/50 px-3 py-1 rounded text-sm">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
