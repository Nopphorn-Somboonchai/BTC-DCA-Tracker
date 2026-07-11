"use client";

import React, { useState } from "react";
import StatementModal from "../components/StatementModal";
import { usePortfolio } from "../hooks/usePortfolio";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import PortfolioChart from "../components/dashboard/PortfolioChart";
import GoalTracker from "../components/dashboard/GoalTracker";
import SettingsModal from "../components/dashboard/SettingsModal";
import Footer from "../components/Footer";

export default function BTCDashboard() {
  const {
    user,
    currentBtcPrice,
    actualThbBalance,
    lastFetchTime,
    goalBtc,
    initialCapital,
    tempGoalBtc,
    tempInitialCapital,
    setTempGoalBtc,
    setTempInitialCapital,
    isSettingsOpen,
    setIsSettingsOpen,
    handleSaveSettings,
    transactions,
    totalInvested,
    isSyncing,
    isPurging,
    handleSyncHistory,
    handlePurgeSimulatedData,
    effectiveBtc,
    totalCostBasis,
    currentPortfolioValue,
    profitOrLoss,
    profitPercentage,
    realAvgPrice,
    chartData,
  } = usePortfolio();

  const [isStatementOpen, setIsStatementOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-4 md:p-8 font-sans">
      <DashboardHeader
        currentBtcPrice={currentBtcPrice}
        lastFetchTime={lastFetchTime}
        user={user}
        isSyncing={isSyncing}
        handleSyncHistory={handleSyncHistory}
        onOpenSettings={() => {
          setTempInitialCapital(initialCapital.toString());
          setTempGoalBtc(goalBtc.toString());
          setIsSettingsOpen(true);
        }}
      />

      <DashboardStats
        currentPortfolioValue={currentPortfolioValue}
        profitOrLoss={profitOrLoss}
        profitPercentage={profitPercentage}
        totalCostBasis={totalCostBasis}
        initialCapital={initialCapital}
        totalInvested={totalInvested}
        effectiveBtc={effectiveBtc}
        actualThbBalance={actualThbBalance}
        realAvgPrice={realAvgPrice}
        onOpenSettings={() => {
          setTempInitialCapital(initialCapital.toString());
          setTempGoalBtc(goalBtc.toString());
          setIsSettingsOpen(true);
        }}
        onOpenStatement={() => setIsStatementOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <PortfolioChart
          chartData={chartData}
          user={user}
          transactionsLength={transactions.length}
        />

        <GoalTracker
          goalBtc={goalBtc}
          effectiveBtc={effectiveBtc}
          onOpenSettings={() => {
            setTempInitialCapital(initialCapital.toString());
            setTempGoalBtc(goalBtc.toString());
            setIsSettingsOpen(true);
          }}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tempInitialCapital={tempInitialCapital}
        setTempInitialCapital={setTempInitialCapital}
        tempGoalBtc={tempGoalBtc}
        setTempGoalBtc={setTempGoalBtc}
        handleSaveSettings={handleSaveSettings}
        user={user}
        isPurging={isPurging}
        handlePurgeSimulatedData={handlePurgeSimulatedData}
      />

      {isStatementOpen && (
        <StatementModal
          isOpen={isStatementOpen}
          onClose={() => setIsStatementOpen(false)}
          transactions={transactions}
        />
      )}
      <Footer />
    </div>
  );
}
