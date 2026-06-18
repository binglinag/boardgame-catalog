export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* 返回按钮骨架 */}
      <div className="h-5 w-20 bg-violet-100 dark:bg-violet-900/20 rounded mb-8" />

      <div className="flex flex-col md:flex-row gap-8">
        {/* 封面图骨架 */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="aspect-[4/5] rounded-2xl bg-violet-100 dark:bg-violet-900/20" />
        </div>

        {/* 信息骨架 */}
        <div className="flex-1 space-y-5">
          {/* 标题 */}
          <div className="space-y-2">
            <div className="h-7 w-3/4 bg-violet-100 dark:bg-violet-900/20 rounded" />
            <div className="h-5 w-1/2 bg-violet-50 dark:bg-violet-900/10 rounded" />
          </div>

          {/* 元数据 Token 行 */}
          <div className="flex gap-2 flex-wrap">
            <div className="h-7 w-16 rounded-full bg-violet-100 dark:bg-violet-900/20" />
            <div className="h-7 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/20" />
            <div className="h-7 w-14 rounded-full bg-amber-100 dark:bg-amber-900/20" />
            <div className="h-7 w-12 rounded-full bg-violet-50 dark:bg-violet-900/10" />
          </div>

          {/* 信息卡片 */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10">
                <div className="h-3 w-10 bg-violet-100 dark:bg-violet-900/20 rounded mb-1.5" />
                <div className="h-5 w-16 bg-violet-50 dark:bg-violet-900/10 rounded" />
              </div>
            ))}
          </div>

          {/* 标签 */}
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-14 rounded-full bg-violet-50 dark:bg-violet-900/10" />
            ))}
          </div>

          {/* 评价文本 */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-violet-50 dark:bg-violet-900/10 rounded" />
            <div className="h-4 w-5/6 bg-violet-50 dark:bg-violet-900/10 rounded" />
            <div className="h-4 w-2/3 bg-violet-50 dark:bg-violet-900/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
