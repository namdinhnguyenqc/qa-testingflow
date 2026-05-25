"use client"

import { useState, useEffect, useCallback } from "react"
import { HelpCircle, Loader2, Play, CheckCircle2, MessageSquare, AlertCircle, AlertTriangle } from "lucide-react"
import { getClarificationThreadAction, submitUserAnswersAction, runReadinessAndUnderstandingAction } from "@/app/actions"
import { Feature } from "@/domain/features/types"
import { ClarificationMessage } from "@/domain/clarifications/types"

interface ClarificationPanelProps {
  projectId: string
  feature: Feature
  onRefresh: () => void
}

export function ClarificationPanel({ projectId, feature, onRefresh }: ClarificationPanelProps) {
  const [messages, setMessages] = useState<ClarificationMessage[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Lưu trữ các câu trả lời đang điền
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const fetchThread = useCallback(async () => {
    setErrorMsg(null)
    const result = await getClarificationThreadAction(feature.id)
    if (result.error) {
      setErrorMsg(result.error)
    } else if (result.data) {
      setThreadId(result.data.thread?.id || null)
      setMessages(result.data.messages || [])
    }
    setLoading(false)
  }, [feature.id])

  useEffect(() => {
    fetchThread()
  }, [fetchThread])

  // Lọc lấy danh sách câu hỏi AI đặt ra
  const aiQuestions = messages.filter((m) => m.sender_type === "AI" && m.question_key)

  // Lấy câu hỏi độc bản (để tránh trùng lặp khi chạy rerun)
  const uniqueQuestions: ClarificationMessage[] = []
  const seenKeys = new Set<string>()
  aiQuestions.forEach((q) => {
    if (q.question_key && !seenKeys.has(q.question_key)) {
      seenKeys.add(q.question_key)
      uniqueQuestions.push(q)
    }
  })

  // Kiểm tra xem câu hỏi đã được user trả lời chưa
  const isQuestionAnswered = (key: string) => {
    return messages.some((m) => m.sender_type === "USER" && m.question_key === key)
  }

  // Lấy nội dung câu trả lời cũ đã chốt
  const getOldAnswer = (key: string) => {
    const ans = messages.find((m) => m.sender_type === "USER" && m.question_key === key)
    return ans ? ans.content : null
  }

  const handleInputChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmitAnswersAndReevaluate = async () => {
    // Gom danh sách câu trả lời
    const dtoList = Object.entries(answers)
      .filter(([_, content]) => content.trim().length > 0)
      .map(([key, content]) => ({
        questionKey: key,
        content: content.trim(),
      }))

    if (dtoList.length === 0 && uniqueQuestions.some((q) => !isQuestionAnswered(q.question_key!))) {
      setErrorMsg("Vui lòng điền ít nhất một câu trả lời để AI re-evaluate.")
      return
    }

    setRunning(true)
    setErrorMsg(null)

    try {
      // 1. Submit answers (nếu có)
      if (dtoList.length > 0) {
        const subResult = await submitUserAnswersAction(feature.id, projectId, dtoList)
        if (subResult.error) throw new Error(subResult.error)
      }

      // 2. Chạy re-evaluate readiness & feature understanding
      const reResult = await runReadinessAndUnderstandingAction(projectId, feature.id, feature.selected_model_id || "gpt-4o")
      if (reResult.error) throw new Error(reResult.error)

      setAnswers({})
      await fetchThread()
      onRefresh()
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-card border border-border rounded-xl">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <MessageSquare className="w-4.5 h-4.5 text-primary" />
            Clarification Center
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Làm rõ các điểm thiếu hoặc mâu thuẫn nghiệp vụ do AI phân tích phát hiện trước khi thiết kế kịch bản test.
          </p>
        </div>

        <button
          onClick={handleSubmitAnswersAndReevaluate}
          disabled={running}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-primary/30 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 cursor-pointer self-start md:self-auto shrink-0"
        >
          {running ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-primary-foreground/10" />
              Submit & Re-evaluate
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* List Questions */}
      {uniqueQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border border-border border-dashed rounded-xl bg-card text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Không có câu hỏi blocking</h4>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Yêu cầu nghiệp vụ đã rõ ràng hoặc không có critical gaps cản trở. Bạn có thể tiến hành bước xác nhận hiểu biết (Understanding).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Critical Questions Checklist ({uniqueQuestions.length})
          </h4>
          
          <div className="space-y-4">
            {uniqueQuestions.map((q) => {
              const answered = isQuestionAnswered(q.question_key!)
              const oldAns = getOldAnswer(q.question_key!)
              return (
                <div
                  key={q.id}
                  className={`bg-card border rounded-xl p-5 shadow-sm space-y-4 transition-all ${
                    answered ? "border-emerald-500/20 bg-emerald-500/5" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          q.is_critical ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                        }`}>
                          {q.is_critical ? "Critical Gap" : "Gap info"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                          Category: {q.category?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-relaxed pt-1">{q.content}</p>
                    </div>
                  </div>

                  {/* Hiển thị Q&A history hoặc Answer Box */}
                  {answered ? (
                    <div className="p-3.5 bg-secondary border border-border rounded-lg text-xs leading-relaxed text-foreground">
                      <span className="font-semibold text-emerald-400 block mb-1">Confirmed Answer:</span>
                      {oldAns}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label htmlFor={`ans-${q.question_key}`} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Your Answer
                      </label>
                      <textarea
                        id={`ans-${q.question_key}`}
                        rows={2}
                        value={answers[q.question_key!] || ""}
                        onChange={(e) => handleInputChange(q.question_key!, e.target.value)}
                        disabled={running}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors resize-none placeholder-muted-foreground/60"
                        placeholder="Cung cấp câu trả lời hoặc chốt rule nghiệp vụ để AI re-evaluate..."
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
