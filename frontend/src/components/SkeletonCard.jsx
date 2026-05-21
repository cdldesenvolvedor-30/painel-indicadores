import { motion } from 'framer-motion'

function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-900 p-6 rounded-3xl border border-slate-800 animate-pulse"
    >
      <div className="h-4 bg-slate-700 rounded w-1/2 mb-6"></div>
      <div className="h-10 bg-slate-700 rounded w-3/4"></div>
    </motion.div>
  )
}

export default SkeletonCard