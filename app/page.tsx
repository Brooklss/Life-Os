"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AuthButton from "@/components/AuthButton"
import { supabase } from "@/lib/supabase-client"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Target,
  Calendar,
  TrendingUp,
  Award,
  BarChart3,
} from "lucide-react"

interface Habit {
  id: string
  name: string
  completions: boolean[]
}

interface Goal {
  id: string
  name: string
  description: string
  completed: boolean
}

interface QuarterData {
  [key: string]: Habit[]
}

interface GoalData {
  [key: string]: Goal[]
}

const getQuarterMonths = (quarterId: string): number[] =>
  quarterId === "Q1" ? [0, 1, 2] : quarterId === "Q2" ? [3, 4, 5] : quarterId === "Q3" ? [6, 7, 8] : [9, 10, 11]

const getQuarterYear = (): number => new Date().getFullYear()

const getMonthDays = (year: number, month0: number): number => new Date(year, month0 + 1, 0).getDate()

const getQuarterMonthOffsets = (quarterId: string): number[] => {
  const year = getQuarterYear()
  const months = getQuarterMonths(quarterId)
  const lengths = months.map((m) => getMonthDays(year, m))
  return [0, lengths[0], lengths[0] + lengths[1]]
}

const getMonthLengthInQuarter = (quarterId: string, monthIndexInQuarter: number): number => {
  const year = getQuarterYear()
  const baseMonth = quarterId === "Q1" ? 0 : quarterId === "Q2" ? 3 : quarterId === "Q3" ? 6 : 9
  const actualMonth = baseMonth + monthIndexInQuarter
  return getMonthDays(year, actualMonth)
}

const normalizeCompletionsForQuarter = (quarterId: string, arr: any): boolean[] => {
  const targetLen = getDaysInQuarter(quarterId)
  const source = Array.isArray(arr) ? arr : []
  const result = Array.from({ length: targetLen }, (_, idx) => Boolean(source[idx]))
  return result
}

const QUARTERS = [
  { id: "Q1", name: "Q1 2025", months: ["January", "February", "March"] },
  { id: "Q2", name: "Q2 2025", months: ["April", "May", "June"] },
  { id: "Q3", name: "Q3 2025", months: ["July", "August", "September"] },
  { id: "Q4", name: "Q4 2025", months: ["October", "November", "December"] },
]

const getDaysInQuarter = (quarterId: string): number => {
  const year = getQuarterYear()
  const months = getQuarterMonths(quarterId)
  return months.reduce((sum, m) => sum + getMonthDays(year, m), 0)
}

const getCurrentDayOfQuarter = (): number => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based
  const day = now.getDate()

  // Determine which quarter we're in and calculate day
  let quarterStart: Date
  if (month >= 0 && month <= 2) {
    // Q1: Jan-Mar
    quarterStart = new Date(year, 0, 1)
  } else if (month >= 3 && month <= 5) {
    // Q2: Apr-Jun
    quarterStart = new Date(year, 3, 1)
  } else if (month >= 6 && month <= 8) {
    // Q3: Jul-Sep
    quarterStart = new Date(year, 6, 1)
  } else {
    // Q4: Oct-Dec
    quarterStart = new Date(year, 9, 1)
  }

  const diffTime = now.getTime() - quarterStart.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  return Math.min(Math.max(diffDays, 1), 90) // Ensure between 1-90 days
}

const getCurrentQuarter = (): string => {
  const now = new Date()
  const month = now.getMonth() // 0-based

  if (month >= 0 && month <= 2) return "Q1"
  if (month >= 3 && month <= 5) return "Q2"
  if (month >= 6 && month <= 8) return "Q3"
  return "Q4"
}

const getCurrentMonthInQuarter = (): number => {
  const now = new Date()
  const month = now.getMonth() // 0-based

  if (month >= 0 && month <= 2) return month // 0, 1, 2 for Jan, Feb, Mar
  if (month >= 3 && month <= 5) return month - 3 // 0, 1, 2 for Apr, May, Jun
  if (month >= 6 && month <= 8) return month - 6 // 0, 1, 2 for Jul, Aug, Sep
  return month - 9 // 0, 1, 2 for Oct, Nov, Dec
}

export default function HabitTracker() {
  const [currentQuarter, setCurrentQuarter] = useState(getCurrentQuarter())
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthInQuarter())
  const [activeTab, setActiveTab] = useState("habits")
  const [quarterData, setQuarterData] = useState<QuarterData>({})
  const [goalData, setGoalData] = useState<GoalData>({})
  const [newGoalName, setNewGoalName] = useState("")
  const [newGoalDescription, setNewGoalDescription] = useState("")
  const [newHabitName, setNewHabitName] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [loadingFromDb, setLoadingFromDb] = useState<boolean>(true)

  const currentDay = getCurrentDayOfQuarter()

  // Session listener and initial load
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id ?? null
      if (!isMounted) return
      setUserId(uid)

      if (uid) {
        await loadAllDataFromSupabase(uid)
      } else {
        // Fallback: load from localStorage if signed out
        const savedData = localStorage.getItem("habitTrackerData")
        const savedGoals = localStorage.getItem("goalTrackerData")
        if (savedData) setQuarterData(JSON.parse(savedData))
        if (savedGoals) setGoalData(JSON.parse(savedGoals))
        setLoadingFromDb(false)
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        await loadAllDataFromSupabase(uid)
      } else {
        setQuarterData({})
        setGoalData({})
        // Load any local data when signed out
        const savedData = localStorage.getItem("habitTrackerData")
        const savedGoals = localStorage.getItem("goalTrackerData")
        if (savedData) setQuarterData(JSON.parse(savedData))
        if (savedGoals) setGoalData(JSON.parse(savedGoals))
        setLoadingFromDb(false)
      }
    })

    init()

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Save data to localStorage whenever quarterData changes
  useEffect(() => {
    if (!userId) {
      localStorage.setItem("habitTrackerData", JSON.stringify(quarterData))
    }
  }, [quarterData])

  useEffect(() => {
    if (!userId) {
      localStorage.setItem("goalTrackerData", JSON.stringify(goalData))
    }
  }, [goalData])

  const currentHabits = quarterData[currentQuarter] || []
  const currentGoals = goalData[currentQuarter] || []
  const daysInQuarter = getDaysInQuarter(currentQuarter)
  const quarterOffsets = getQuarterMonthOffsets(currentQuarter)
  const monthLength = getMonthLengthInQuarter(currentQuarter, currentMonth)
  
  // Get responsive grid template columns
  const getGridTemplateColumns = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const habitColWidth = isMobile ? '200px' : '250px'
    const dayColWidth = isMobile ? '32px' : '40px'
    const actionColWidth = isMobile ? '60px' : '80px'
    return `${habitColWidth} repeat(${monthLength}, ${dayColWidth}) ${actionColWidth} ${actionColWidth}`
  }

  // Get responsive right positioning for sticky columns
  const getRightPosition = (column: 'progress' | 'delete') => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const actionColWidth = isMobile ? '60px' : '80px'
    return column === 'progress' ? actionColWidth : '0px'
  }

  const addHabit = async () => {
    if (!newHabitName.trim()) return

    const habitName = newHabitName.trim()
    setNewHabitName("") // Clear input immediately for better UX

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: habitName,
      completions: new Array(daysInQuarter).fill(false),
    }

    // Add to UI immediately for responsive experience
    setQuarterData((prev) => ({
      ...prev,
      [currentQuarter]: [...(prev[currentQuarter] || []), newHabit],
    }))

    if (userId) {
      try {
        // Insert to Supabase
        const { data, error } = await supabase
          .from("habits")
          .insert({
            user_id: userId,
            name: habitName,
            completions: newHabit.completions,
            quarter: currentQuarter,
          })
          .select("id, name, completions, quarter")
          .single()
        
        if (error) {
          console.error("Failed to save habit:", error)
          // Remove from UI on error
          setQuarterData((prev) => ({
            ...prev,
            [currentQuarter]: (prev[currentQuarter] || []).filter(h => h.id !== newHabit.id)
          }))
          alert(`Failed to save habit. Please try again.`)
        } else if (data) {
          // Update with real ID from database
          const inserted: Habit = {
            id: data.id as string,
            name: data.name,
            completions: normalizeCompletionsForQuarter(currentQuarter, (data as any).completions),
          }
          setQuarterData((prev) => ({
            ...prev,
            [currentQuarter]: (prev[currentQuarter] || []).map(h => 
              h.id === newHabit.id ? inserted : h
            ),
          }))
        }
      } catch (err) {
        console.error("Network error saving habit:", err)
        // Remove from UI on error
        setQuarterData((prev) => ({
          ...prev,
          [currentQuarter]: (prev[currentQuarter] || []).filter(h => h.id !== newHabit.id)
        }))
        alert(`Network error. Please check your connection and try again.`)
      }
    }
  }

  const deleteHabit = async (habitId: string) => {
    // Remove from UI immediately
    setQuarterData((prev) => ({
      ...prev,
      [currentQuarter]: (prev[currentQuarter] || []).filter((h) => h.id !== habitId),
    }))

    // Delete from Supabase in background
    if (userId) {
      try {
        const { error } = await supabase
          .from("habits")
          .delete()
          .match({ id: habitId, user_id: userId })
        
        if (error) {
          console.error("Failed to delete habit:", error)
          alert(`Failed to delete habit. Please refresh and try again.`)
        }
      } catch (err) {
        console.error("Network error deleting habit:", err)
        alert(`Network error. Please check your connection and try again.`)
      }
    }
  }

  const toggleCompletion = async (habitId: string, dayIndex: number) => {
    const absoluteIndex = quarterOffsets[currentMonth] + dayIndex
    
    // Find the habit first
    const habit = currentHabits.find(h => h.id === habitId)
    if (!habit) {
      console.error('Habit not found:', habitId)
      return
    }
    
    const base = normalizeCompletionsForQuarter(currentQuarter, habit.completions)
    const newCompletions = base.map((completed, index) => (index === absoluteIndex ? !completed : completed))
    const updated: Habit = { ...habit, completions: newCompletions }
    
    // Update state immediately for responsive UI
    setQuarterData((prev) => ({
      ...prev,
      [currentQuarter]: (prev[currentQuarter] || []).map((h) => h.id === habitId ? updated : h)
    }))

    // Save to Supabase in background
    if (userId) {
      try {
        const { error } = await supabase
          .from("habits")
          .update({ completions: updated.completions })
          .match({ id: habitId, user_id: userId })
        
        if (error) {
          console.error("Failed to save habit completion:", error)
          // Revert the change on error
          setQuarterData((prev) => ({
            ...prev,
            [currentQuarter]: (prev[currentQuarter] || []).map((h) => h.id === habitId ? habit : h)
          }))
          alert(`Failed to save habit completion. Please try again.`)
        }
      } catch (err) {
        console.error("Network error saving habit:", err)
        // Revert the change on error
        setQuarterData((prev) => ({
          ...prev,
          [currentQuarter]: (prev[currentQuarter] || []).map((h) => h.id === habitId ? habit : h)
        }))
        alert(`Network error. Please check your connection and try again.`)
      }
    }
  }

  const navigateQuarter = (direction: "prev" | "next") => {
    const currentIndex = QUARTERS.findIndex((q) => q.id === currentQuarter)
    if (direction === "prev" && currentIndex > 0) {
      setCurrentQuarter(QUARTERS[currentIndex - 1].id)
      setCurrentMonth(0)
    } else if (direction === "next" && currentIndex < QUARTERS.length - 1) {
      setCurrentQuarter(QUARTERS[currentIndex + 1].id)
      setCurrentMonth(0)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev" && currentMonth > 0) {
      setCurrentMonth(currentMonth - 1)
    } else if (direction === "next" && currentMonth < 2) {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const addGoal = async () => {
    if (!newGoalName.trim()) return

    const goalName = newGoalName.trim()
    const goalDescription = newGoalDescription.trim()
    
    // Clear inputs immediately for better UX
    setNewGoalName("")
    setNewGoalDescription("")

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      description: goalDescription,
      completed: false,
    }

    // Add to UI immediately for responsive experience
    setGoalData((prev) => ({
      ...prev,
      [currentQuarter]: [...(prev[currentQuarter] || []), newGoal],
    }))

    if (userId) {
      try {
        const { data, error } = await supabase
          .from("goals")
          .insert({ 
            user_id: userId, 
            name: goalName, 
            description: goalDescription, 
            completed: false, 
            quarter: currentQuarter 
          })
          .select("id, name, description, completed, quarter")
          .single()
        
        if (error) {
          console.error("Failed to save goal:", error)
          // Remove from UI on error
          setGoalData((prev) => ({
            ...prev,
            [currentQuarter]: (prev[currentQuarter] || []).filter(g => g.id !== newGoal.id)
          }))
          alert(`Failed to save goal. Please try again.`)
        } else if (data) {
          // Update with real ID from database
          const inserted: Goal = {
            id: data.id as string,
            name: data.name,
            description: data.description ?? "",
            completed: data.completed,
          }
          setGoalData((prev) => ({
            ...prev,
            [currentQuarter]: (prev[currentQuarter] || []).map(g => 
              g.id === newGoal.id ? inserted : g
            ),
          }))
        }
      } catch (err) {
        console.error("Network error saving goal:", err)
        // Remove from UI on error
        setGoalData((prev) => ({
          ...prev,
          [currentQuarter]: (prev[currentQuarter] || []).filter(g => g.id !== newGoal.id)
        }))
        alert(`Network error. Please check your connection and try again.`)
      }
    }
  }

  const deleteGoal = async (goalId: string) => {
    // Remove from UI immediately
    setGoalData((prev) => ({
      ...prev,
      [currentQuarter]: (prev[currentQuarter] || []).filter((g) => g.id !== goalId),
    }))

    // Delete from Supabase in background
    if (userId) {
      try {
        const { error } = await supabase
          .from("goals")
          .delete()
          .match({ id: goalId, user_id: userId })
        
        if (error) {
          console.error("Failed to delete goal:", error)
          alert(`Failed to delete goal. Please refresh and try again.`)
        }
      } catch (err) {
        console.error("Network error deleting goal:", err)
        alert(`Network error. Please check your connection and try again.`)
      }
    }
  }

  const toggleGoalCompletion = async (goalId: string) => {
    // Find the goal first
    const goal = currentGoals.find(g => g.id === goalId)
    if (!goal) {
      console.error('Goal not found:', goalId)
      return
    }
    
    const newCompleted = !goal.completed
    
    // Update state immediately for responsive UI
    setGoalData((prev) => ({
      ...prev,
      [currentQuarter]: (prev[currentQuarter] || []).map((g) => 
        g.id === goalId ? { ...g, completed: newCompleted } : g
      )
    }))
    
    // Save to Supabase in background
    if (userId) {
      try {
        const { error } = await supabase
          .from("goals")
          .update({ completed: newCompleted })
          .match({ id: goalId, user_id: userId })
        
        if (error) {
          console.error("Failed to save goal completion:", error)
          // Revert the change on error
          setGoalData((prev) => ({
            ...prev,
            [currentQuarter]: (prev[currentQuarter] || []).map((g) => 
              g.id === goalId ? goal : g
            )
          }))
          alert(`Failed to save goal completion. Please try again.`)
        }
      } catch (err) {
        console.error("Network error saving goal:", err)
        // Revert the change on error
        setGoalData((prev) => ({
          ...prev,
          [currentQuarter]: (prev[currentQuarter] || []).map((g) => 
            g.id === goalId ? goal : g
          )
        }))
        alert(`Network error. Please check your connection and try again.`)
      }
    }
  }

  // Load all quarters data from Supabase for signed-in user
  const loadAllDataFromSupabase = async (uid: string) => {
    setLoadingFromDb(true)
    const [habitsRes, goalsRes] = await Promise.all([
      supabase.from("habits").select("id, name, completions, quarter").eq("user_id", uid),
      supabase.from("goals").select("id, name, description, completed, quarter").eq("user_id", uid),
    ])

    const newQuarterData: QuarterData = {}
    if (!habitsRes.error && habitsRes.data) {
      for (const row of habitsRes.data as any[]) {
        const q = row.quarter as string
        const arr = newQuarterData[q] || []
        arr.push({ 
          id: row.id as string, 
          name: row.name as string, 
          completions: normalizeCompletionsForQuarter(q, row.completions) 
        })
        newQuarterData[q] = arr
      }
      // Sort habits by creation order (oldest first) to maintain consistent order
      Object.keys(newQuarterData).forEach(quarter => {
        newQuarterData[quarter].sort((a, b) => a.id.localeCompare(b.id))
      })
    }

    const newGoalData: GoalData = {}
    if (!goalsRes.error && goalsRes.data) {
      for (const row of goalsRes.data as any[]) {
        const q = row.quarter as string
        const arr = newGoalData[q] || []
        arr.push({ 
          id: row.id as string, 
          name: row.name as string, 
          description: (row.description as string) || "", 
          completed: !!row.completed 
        })
        newGoalData[q] = arr
      }
      // Sort goals by creation order (oldest first) to maintain consistent order
      Object.keys(newGoalData).forEach(quarter => {
        newGoalData[quarter].sort((a, b) => a.id.localeCompare(b.id))
      })
    }

    setQuarterData(newQuarterData)
    setGoalData(newGoalData)
    setLoadingFromDb(false)
  }

  const currentQuarterInfo = QUARTERS.find((q) => q.id === currentQuarter)

  const getHabitProgress = (habit: Habit) => {
    const normalized = normalizeCompletionsForQuarter(currentQuarter, habit.completions)
    const completed = normalized.slice(0, currentDay).filter(Boolean).length
    const total = Math.min(currentDay, normalized.length)
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const getOverallProgress = () => {
    if (currentHabits.length === 0) return { completed: 0, total: 0, percentage: 0 }

    const totalCompleted = currentHabits.reduce((sum, habit) => {
      const normalized = normalizeCompletionsForQuarter(currentQuarter, habit.completions)
      return sum + normalized.slice(0, currentDay).filter(Boolean).length
    }, 0)

    const totalPossible = currentHabits.length * currentDay
    return {
      completed: totalCompleted,
      total: totalPossible,
      percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    }
  }

  const getGoalProgress = () => {
    const completed = currentGoals.filter((goal) => goal.completed).length
    const total = currentGoals.length
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const getComprehensiveStats = () => {
    const allQuarters = Object.keys(quarterData)
    const totalHabits = allQuarters.reduce((sum, quarter) => sum + (quarterData[quarter]?.length || 0), 0)

    const totalGoals = Object.keys(goalData).reduce((sum, quarter) => sum + (goalData[quarter]?.length || 0), 0)
    const completedGoals = Object.keys(goalData).reduce((sum, quarter) => {
      return sum + (goalData[quarter]?.filter((goal) => goal.completed).length || 0)
    }, 0)

    const currentQuarterHabits = currentHabits.length
    const currentQuarterGoals = currentGoals.length
    const currentQuarterCompletedGoals = currentGoals.filter((goal) => goal.completed).length

    // Calculate streak data for current quarter
    const streakData = currentHabits.map((habit) => {
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0

      const normalized = normalizeCompletionsForQuarter(currentQuarter, habit.completions)
      for (let i = 0; i < Math.min(currentDay, normalized.length); i++) {
        if (normalized[i]) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
          if (i === Math.min(currentDay, normalized.length) - 1) {
            currentStreak = tempStreak
          }
        } else {
          tempStreak = 0
          if (i === Math.min(currentDay, normalized.length) - 1) {
            currentStreak = 0
          }
        }
      }

      return {
        name: habit.name,
        currentStreak,
        longestStreak,
        completionRate: getHabitProgress(habit).percentage,
      }
    })

    return {
      totalHabits,
      totalGoals,
      completedGoals,
      currentQuarterHabits,
      currentQuarterGoals,
      currentQuarterCompletedGoals,
      streakData,
      overallProgress: getOverallProgress(),
      goalProgress: getGoalProgress(),
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-emerald-400" />
                <h2 className="text-lg md:text-xl font-bold text-white">Habit Tracker</h2>
              </div>
              <div className="hidden md:flex gap-1 bg-slate-700/50 rounded-lg p-1">
                <Button
                  variant={activeTab === "habits" ? "default" : "ghost"}
                  onClick={() => setActiveTab("habits")}
                  className={`text-sm transition-all duration-200 ${
                    activeTab === "habits"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-600 hover:text-white"
                  }`}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Habits
                </Button>
                <Button
                  variant={activeTab === "goals" ? "default" : "ghost"}
                  onClick={() => setActiveTab("goals")}
                  className={`text-sm transition-all duration-200 ${
                    activeTab === "goals"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-600 hover:text-white"
                  }`}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Goals
                </Button>
                <Button
                  variant={activeTab === "stats" ? "default" : "ghost"}
                  onClick={() => setActiveTab("stats")}
                  className={`text-sm transition-all duration-200 ${
                    activeTab === "stats"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-600 hover:text-white"
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Stats
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 text-sm">
              <div className="hidden md:flex items-center gap-4">
                {activeTab === "habits" ? (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Award className="h-4 w-4 text-emerald-400" />
                    <span>{getOverallProgress().percentage}% Complete</span>
                  </div>
                ) : activeTab === "goals" ? (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <span>
                      {getGoalProgress().completed}/{getGoalProgress().total} Goals
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-300">
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                    <span>Analytics Overview</span>
                  </div>
                )}
                <div className="ml-4 pl-4 border-l border-slate-700">
                  <AuthButton />
                </div>
              </div>
              <div className="md:hidden">
                <div className="flex flex-col gap-2">
                  <AuthButton />
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-slate-700 py-3">
            <div className="flex gap-1 bg-slate-700/50 rounded-lg p-1">
              <Button
                variant={activeTab === "habits" ? "default" : "ghost"}
                onClick={() => setActiveTab("habits")}
                className={`flex-1 text-xs transition-all duration-200 ${
                  activeTab === "habits"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-600 hover:text-white"
                }`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Habits
              </Button>
              <Button
                variant={activeTab === "goals" ? "default" : "ghost"}
                onClick={() => setActiveTab("goals")}
                className={`flex-1 text-xs transition-all duration-200 ${
                  activeTab === "goals"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-600 hover:text-white"
                }`}
              >
                <Target className="h-3 w-3 mr-1" />
                Goals
              </Button>
              <Button
                variant={activeTab === "stats" ? "default" : "ghost"}
                onClick={() => setActiveTab("stats")}
                className={`flex-1 text-xs transition-all duration-200 ${
                  activeTab === "stats"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-600 hover:text-white"
                }`}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Stats
              </Button>
            </div>
            
            {/* Mobile Progress Info */}
            <div className="mt-3 flex justify-center">
              {activeTab === "habits" ? (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <span>{getOverallProgress().percentage}% Complete</span>
                </div>
              ) : activeTab === "goals" ? (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <span>
                    {getGoalProgress().completed}/{getGoalProgress().total} Goals
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  <span>Analytics Overview</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {activeTab === "stats" ? (
            <>
              {/* Stats Header */}
              <div className="mb-8 flex flex-col items-center gap-6">
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateQuarter("prev")}
                    disabled={currentQuarter === "Q1"}
                    className="text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-1">{currentQuarterInfo?.name} Analytics</h1>
                    <p className="text-slate-400 text-sm">Track your progress and insights</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateQuarter("next")}
                    disabled={currentQuarter === "Q4"}
                    className="text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                {(() => {
                  const stats = getComprehensiveStats()
                  return (
                    <>
                      <div className="bg-slate-800/50 rounded-xl p-3 md:p-6 border border-slate-700">
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                          <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                          <h3 className="font-semibold text-white text-sm md:text-base">Current Progress</h3>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">
                          {stats.overallProgress.percentage}%
                        </div>
                        <p className="text-xs md:text-sm text-slate-400">
                          {stats.overallProgress.completed} of {stats.overallProgress.total} completions
                        </p>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-3 md:p-6 border border-slate-700">
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                          <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                          <h3 className="font-semibold text-white text-sm md:text-base">Active Habits</h3>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-1">{stats.currentQuarterHabits}</div>
                        <p className="text-xs md:text-sm text-slate-400">This quarter</p>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-3 md:p-6 border border-slate-700">
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                          <Target className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                          <h3 className="font-semibold text-white text-sm md:text-base">Goals Progress</h3>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-purple-400 mb-1">{stats.goalProgress.percentage}%</div>
                        <p className="text-xs md:text-sm text-slate-400">
                          {stats.currentQuarterCompletedGoals} of {stats.currentQuarterGoals} completed
                        </p>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-3 md:p-6 border border-slate-700">
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                          <Award className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                          <h3 className="font-semibold text-white text-sm md:text-base">Current Day</h3>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1">{currentDay}</div>
                        <p className="text-xs md:text-sm text-slate-400">of 90 days</p>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Habit Performance */}
              {(() => {
                const stats = getComprehensiveStats()
                return stats.streakData.length > 0 ? (
                  <div className="bg-slate-800/30 rounded-xl p-6 mb-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                      Habit Performance
                    </h3>
                    <div className="grid gap-4">
                      {stats.streakData.map((habit, index) => (
                        <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-white">{habit.name}</h4>
                            <div className="text-sm text-emerald-400 font-medium">{habit.completionRate}%</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Current Streak: </span>
                              <span className="text-white font-medium">{habit.currentStreak} days</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Best Streak: </span>
                              <span className="text-white font-medium">{habit.longestStreak} days</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <BarChart3 className="h-20 w-20 mx-auto mb-6 text-slate-500" />
                    <p className="text-xl font-medium mb-2">No data to analyze yet</p>
                    <p className="text-sm">Start tracking habits to see your performance analytics!</p>
                  </div>
                )
              })()}

              {/* All-Time Overview */}
              {(() => {
                const stats = getComprehensiveStats()
                return (
                  <div className="bg-slate-800/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-400" />
                      All-Time Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400 mb-1">{stats.totalHabits}</div>
                        <p className="text-sm text-slate-400">Total Habits Created</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">{stats.totalGoals}</div>
                        <p className="text-sm text-slate-400">Total Goals Set</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.completedGoals}</div>
                        <p className="text-sm text-slate-400">Goals Achieved</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : activeTab === "habits" ? (
            <>
              {/* Header with Quarter Navigation */}
              <div className="mb-6 md:mb-8 flex flex-col items-center gap-4 md:gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateQuarter("prev")}
                    disabled={currentQuarter === "Q1"}
                    className="text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 hover:scale-105 h-8 w-8 md:h-10 md:w-10"
                  >
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>

                  <div className="text-center">
                    <h1 className="text-xl md:text-3xl font-bold text-white mb-1">{currentQuarterInfo?.name}</h1>
                    <p className="text-slate-400 text-xs md:text-sm">Day {currentDay} of 90</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateQuarter("next")}
                    disabled={currentQuarter === "Q4"}
                    className="text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 hover:scale-105 h-8 w-8 md:h-10 md:w-10"
                  >
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-slate-800/50 rounded-lg px-3 md:px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                    disabled={currentMonth === 0}
                    className="text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200 h-8 w-8 md:h-9 md:w-9"
                  >
                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>

                  <span className="text-sm md:text-lg font-medium text-emerald-300 min-w-[100px] md:min-w-[120px] text-center">
                    {currentQuarterInfo?.months[currentMonth]}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                    disabled={currentMonth === 2}
                    className="text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200 h-8 w-8 md:h-9 md:w-9"
                  >
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>

                {currentHabits.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-6 text-xs md:text-sm">
                    <div className="bg-slate-800/50 rounded-lg px-3 md:px-4 py-2">
                      <span className="text-slate-400">Overall Progress: </span>
                      <span className="text-emerald-400 font-semibold">{getOverallProgress().percentage}%</span>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg px-3 md:px-4 py-2">
                      <span className="text-slate-400">Habits: </span>
                      <span className="text-white font-semibold">{currentHabits.length}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Habit Form */}
              <div className="mb-6 md:mb-8 flex justify-center">
                <div className="flex w-full max-w-md gap-2">
                  <Input
                    placeholder="Add a new habit..."
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addHabit()}
                    className="bg-slate-800/80 text-white border-slate-600 focus:border-emerald-500 placeholder:text-slate-400 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 text-sm md:text-base"
                  />
                  <Button
                    onClick={addHabit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-emerald-500/25 h-10 w-10 md:h-11 md:w-11"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop Habits Grid */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-fit">
                  {/* Header Row */}
                  <div className={`mb-4 grid gap-1 text-xs md:text-sm`} style={{gridTemplateColumns: getGridTemplateColumns()}}>
                    <div className="font-semibold text-white sticky left-0 bg-slate-900 z-50 px-2 py-1 border-r-2 border-slate-500 shadow-xl" style={{backdropFilter: 'blur(10px)'}}>Habits</div>
                    {Array.from({ length: monthLength }, (_, i) => {
                      const absDayNumber = quarterOffsets[currentMonth] + (i + 1)
                      const isCurrent = absDayNumber === currentDay
                      const isPast = absDayNumber < currentDay
                      return (
                        <div
                          key={i}
                          className={`text-center font-medium transition-all duration-200 ${
                            isCurrent
                              ? "text-emerald-400 font-bold scale-110"
                              : isPast
                                ? "text-slate-300"
                                : "text-slate-500"
                          }`}
                        >
                          {i + 1}
                        </div>
                      )
                    })}
                    <div className="text-center text-slate-400 font-medium sticky bg-slate-900 z-50 px-2 py-1 border-l-2 border-slate-500 shadow-xl" style={{backdropFilter: 'blur(10px)', right: getRightPosition('progress')}}>Progress</div>
                    <div className="text-center text-slate-400 font-medium sticky bg-slate-900 z-50 px-2 py-1 shadow-xl" style={{backdropFilter: 'blur(10px)', right: getRightPosition('delete')}}>Delete</div>
                  </div>

                  {/* Habit Rows */}
                  {currentHabits.map((habit) => {
                    const progress = getHabitProgress(habit)
                    return (
                      <div
                        key={habit.id}
                        className="mb-3 grid gap-1 items-center bg-slate-800/30 rounded-lg p-2 hover:bg-slate-800/50 transition-all duration-200"
                        style={{gridTemplateColumns: getGridTemplateColumns()}}
                      >
                        <div className="text-white font-medium truncate pr-2 text-sm md:text-base sticky left-0 bg-slate-800 z-50 px-2 py-1 border-r-2 border-slate-500 shadow-xl" style={{backdropFilter: 'blur(10px)'}}>{habit.name}</div>

                        {Array.from({ length: monthLength }, (_, dayIndex) => {
                          const absoluteIndex = quarterOffsets[currentMonth] + dayIndex
                          const absDayNumber = absoluteIndex + 1
                          const isCurrent = absDayNumber === currentDay
                          const isPast = absDayNumber < currentDay
                          const isFuture = absDayNumber > currentDay
                          const isChecked = !!habit.completions[absoluteIndex]
                          return (
                            <button
                              key={dayIndex}
                              onClick={() => toggleCompletion(habit.id, dayIndex)}
                              disabled={isFuture}
                              className={`h-6 w-6 md:h-8 md:w-8 flex items-center justify-center rounded-lg border transition-all duration-200 hover:scale-110 ${
                                isCurrent
                                  ? "border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/50"
                                  : isPast
                                    ? isChecked
                                      ? "border-emerald-500 bg-emerald-500/40 hover:bg-emerald-500/50"
                                      : "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                                    : "border-slate-600 bg-slate-700/50 cursor-not-allowed opacity-50"
                              }`}
                            >
                              {isChecked && <X className="h-3 w-3 md:h-4 md:w-4 text-emerald-400" />}
                            </button>
                          )
                        })}

                        <div className="text-center sticky bg-slate-800 z-50 px-2 py-1 border-l-2 border-slate-500 shadow-xl" style={{backdropFilter: 'blur(10px)', right: getRightPosition('progress')}}>
                          <div className="text-xs text-slate-400">{progress.percentage}%</div>
                          <div className="text-xs text-slate-500">
                            {progress.completed}/{progress.total}
                          </div>
                        </div>

                        <div className="flex justify-center sticky bg-slate-800 z-50 px-2 py-1 shadow-xl" style={{backdropFilter: 'blur(10px)', right: getRightPosition('delete')}}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteHabit(habit.id)}
                            className="h-6 w-6 md:h-8 md:w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mobile Habits Layout - Horizontal Names, Vertical Days */}
              <div className="md:hidden">
                {/* Habit Names Header - Horizontal */}
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {currentHabits.map((habit) => {
                    const progress = getHabitProgress(habit)
                    return (
                      <div key={habit.id} className="bg-slate-800/30 rounded-lg p-3 min-w-[120px] flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium text-sm truncate">{habit.name}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteHabit(habit.id)}
                            className="h-5 w-5 text-red-400 hover:bg-red-500/20 hover:text-red-300 ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-emerald-400 font-semibold">{progress.percentage}%</div>
                          <div className="text-xs text-slate-500">{progress.completed}/{progress.total}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Days Grid - Vertical */}
                <div className="space-y-1">
                  {/* Header Row - Habit Names */}
                  <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg mb-2">
                    <div className="w-8 text-center">
                      <span className="text-xs text-slate-400 font-medium">Day</span>
                    </div>
                    <div className="flex gap-1 flex-1">
                      {currentHabits.map((habit) => (
                        <div key={habit.id} className="w-8 h-8 flex items-center justify-center">
                          <span className="text-xs text-slate-300 font-medium truncate">
                            {habit.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Days Rows */}
                  {Array.from({ length: monthLength }, (_, dayIndex) => {
                    const absoluteIndex = quarterOffsets[currentMonth] + dayIndex
                    const absDayNumber = absoluteIndex + 1
                    const isCurrent = absDayNumber === currentDay
                    const isPast = absDayNumber < currentDay
                    const isFuture = absDayNumber > currentDay
                    
                    return (
                      <div key={dayIndex} className="flex items-center gap-3 p-2">
                        {/* Day Number */}
                        <div className="w-8 text-center">
                          <span className={`text-sm font-medium ${
                            isCurrent ? "text-emerald-400" : "text-slate-300"
                          }`}>
                            {dayIndex + 1}
                          </span>
                        </div>

                        {/* Habit Checkboxes - Small Squares */}
                        <div className="flex gap-1 flex-1">
                          {currentHabits.map((habit) => {
                            const isChecked = !!habit.completions[absoluteIndex]
                            return (
                              <button
                                key={habit.id}
                                onClick={() => toggleCompletion(habit.id, dayIndex)}
                                disabled={isFuture}
                                className={`w-8 h-8 flex items-center justify-center rounded border transition-all duration-200 ${
                                  isCurrent
                                    ? "border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30"
                                    : isPast
                                      ? isChecked
                                        ? "border-emerald-500 bg-emerald-500/40 hover:bg-emerald-500/50"
                                        : "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                                      : "border-slate-600 bg-slate-700/50 cursor-not-allowed opacity-50"
                                }`}
                              >
                                {isChecked && <X className="h-4 w-4 text-emerald-400" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {currentHabits.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-500" />
                  <p className="text-xl font-medium mb-2">No habits yet for {currentQuarterInfo?.name}</p>
                  <p className="text-sm">Add your first habit above to start building consistency!</p>
                </div>
              )}

              {/* Quarter Info */}
              <div className="mt-12 text-center text-sm text-slate-400 bg-slate-800/30 rounded-lg p-4">
                <p className="font-medium">Tracking habits for {currentQuarterInfo?.months.join(", ")}</p>
                <p className="mt-1">Each quarter starts with a clean slate • Build consistency day by day</p>
              </div>
            </>
          ) : (
            <>
              {/* Header with Quarter Navigation */}
              <div className="mb-6 md:mb-8 flex flex-col items-center gap-4 md:gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateQuarter("prev")}
                    disabled={currentQuarter === "Q1"}
                    className="text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 hover:scale-105 h-8 w-8 md:h-10 md:w-10"
                  >
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>

                  <div className="text-center">
                    <h1 className="text-xl md:text-3xl font-bold text-white mb-1">{currentQuarterInfo?.name} Goals</h1>
                    <p className="text-slate-400 text-xs md:text-sm">Set your quarterly objectives</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateQuarter("next")}
                    disabled={currentQuarter === "Q4"}
                    className="text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 hover:scale-105 h-8 w-8 md:h-10 md:w-10"
                  >
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-slate-800/50 rounded-lg px-3 md:px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                    disabled={currentMonth === 0}
                    className="text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200 h-8 w-8 md:h-9 md:w-9"
                  >
                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>

                  <span className="text-sm md:text-lg font-medium text-emerald-300 min-w-[100px] md:min-w-[120px] text-center">
                    {currentQuarterInfo?.months[currentMonth]}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                    disabled={currentMonth === 2}
                    className="text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200 h-8 w-8 md:h-9 md:w-9"
                  >
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>

                {currentGoals.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-6 text-xs md:text-sm">
                    <div className="bg-slate-800/50 rounded-lg px-3 md:px-4 py-2">
                      <span className="text-slate-400">Completion: </span>
                      <span className="text-emerald-400 font-semibold">{getGoalProgress().percentage}%</span>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg px-3 md:px-4 py-2">
                      <span className="text-slate-400">Goals: </span>
                      <span className="text-white font-semibold">
                        {getGoalProgress().completed}/{getGoalProgress().total}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Goal Form */}
              <div className="mb-6 md:mb-8 flex justify-center">
                <div className="flex flex-col w-full max-w-md gap-3 bg-slate-800/30 rounded-lg p-3 md:p-4">
                  <Input
                    placeholder="Goal name..."
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="bg-slate-800/80 text-white border-slate-600 focus:border-emerald-500 placeholder:text-slate-400 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 text-sm md:text-base"
                  />
                  <Input
                    placeholder="Goal description (optional)..."
                    value={newGoalDescription}
                    onChange={(e) => setNewGoalDescription(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addGoal()}
                    className="bg-slate-800/80 text-white border-slate-600 focus:border-emerald-500 placeholder:text-slate-400 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 text-sm md:text-base"
                  />
                  <Button
                    onClick={addGoal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-emerald-500/25 text-sm md:text-base"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                </div>
              </div>

              {/* Goals List */}
              <div className="max-w-4xl mx-auto">
                {currentGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`mb-3 md:mb-4 p-4 md:p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                      goal.completed
                        ? "bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                        : "bg-slate-800/50 border-slate-600 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 md:gap-4">
                          <button
                            onClick={() => toggleGoalCompletion(goal.id)}
                            className={`h-6 w-6 md:h-7 md:w-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 flex-shrink-0 ${
                              goal.completed
                                ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/25"
                                : "border-slate-500 hover:border-emerald-500 hover:bg-emerald-500/10"
                            }`}
                          >
                            {goal.completed && <X className="h-3 w-3 md:h-4 md:w-4 text-white" />}
                          </button>
                          <h3
                            className={`text-lg md:text-xl font-semibold transition-all duration-200 truncate ${
                              goal.completed ? "text-emerald-300 line-through" : "text-white"
                            }`}
                          >
                            {goal.name}
                          </h3>
                        </div>
                        {goal.description && (
                          <p
                            className={`mt-2 md:mt-3 ml-9 md:ml-11 leading-relaxed text-sm md:text-base ${goal.completed ? "text-slate-400" : "text-slate-300"}`}
                          >
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                        className="h-8 w-8 md:h-9 md:w-9 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 hover:scale-110 flex-shrink-0 ml-2"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {currentGoals.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <Target className="h-20 w-20 mx-auto mb-6 text-slate-500" />
                    <p className="text-xl font-medium mb-2">No goals yet for {currentQuarterInfo?.name}</p>
                    <p className="text-sm">Set your first quarterly goal above to get started!</p>
                  </div>
                )}
              </div>

              {/* Quarter Info */}
              <div className="mt-12 text-center text-sm text-slate-400 bg-slate-800/30 rounded-lg p-4">
                <p className="font-medium">Setting goals for {currentQuarterInfo?.months.join(", ")}</p>
                <p className="mt-1">Each quarter starts with a clean slate • Focus on what matters most</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
