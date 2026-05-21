import { createContext, useContext, useState } from 'react'

const FiltrosContext = createContext()

export function FiltrosProvider({ children }) {
  const [filtros, setFiltros] = useState({
    inicio: '',
    fim: '',
    setor: '',
    colaboradorId: ''
  })

  function atualizarFiltro(campo, valor) {
    setFiltros((old) => ({
      ...old,
      [campo]: valor
    }))
  }

  function limparFiltros() {
    setFiltros({
      inicio: '',
      fim: '',
      setor: '',
      colaboradorId: ''
    })
  }

  return (
    <FiltrosContext.Provider
      value={{
        filtros,
        atualizarFiltro,
        limparFiltros
      }}
    >
      {children}
    </FiltrosContext.Provider>
  )
}

export function useFiltros() {
  return useContext(FiltrosContext)
}