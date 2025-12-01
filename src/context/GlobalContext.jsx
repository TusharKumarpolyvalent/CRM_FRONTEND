import { createContext, useContext, useState } from 'react';

export const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalContextProvide = ({ children }) => {
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [showAddLeadsModal, setShowAddLeadsModal] = useState(false);
  return (
    <GlobalContext.Provider
      value={{
        showAddCampaignModal,
        showAddLeadsModal,
        setShowAddCampaignModal,
        setShowAddLeadsModal,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
