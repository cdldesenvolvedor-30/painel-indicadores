import { motion } from 'framer-motion'

function MetricCard({
  titulo,
  valor,
  cor,
  icone: Icon
}) {

  return (

    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}

      animate={{
        opacity: 1,
        y: 0
      }}

      transition={{
        duration: 0.4
      }}

      whileHover={{
        scale: 1.03
      }}

      className="
        bg-gradient-to-br
        from-slate-900
        to-slate-950

        p-6
        rounded-3xl
        border
        border-slate-800

        shadow-xl

        transition
      "
    >

      <div className="flex justify-between items-start">

        <div>

          <p className="text-slate-400 text-sm">
            {titulo}
          </p>

          <h2 className={`text-4xl font-bold mt-4 ${cor}`}>
            {valor}
          </h2>

        </div>

        {
          Icon && (

            <motion.div
              whileHover={{
                rotate: 8
              }}

              className="
                bg-slate-800
                p-3
                rounded-2xl
              "
            >

              <Icon size={26} />

            </motion.div>

          )
        }

      </div>

    </motion.div>

  )

}

export default MetricCard