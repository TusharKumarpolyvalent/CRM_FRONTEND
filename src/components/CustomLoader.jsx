import { motion } from 'framer-motion';

export default function CustomLoader({ screen }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-32 h-32 border-4 border-gray-300 border-t-transparent rounded-full"
      ></motion.div>

      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-3xl mt-4 text-gray-700 font-medium"
      >
        {screen}
      </motion.p>
    </motion.div>
  );
}
