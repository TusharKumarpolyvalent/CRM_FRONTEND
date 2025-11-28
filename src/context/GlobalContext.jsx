import { createContext, useContext, useState } from "react";

export const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalContextProvide = ({children})=>{
   const[showAddCampaignModal,setShowAddCampaignModal]=useState(false);
    return <GlobalContext.Provider  value={
      {
        showAddCampaignModal,
        setShowAddCampaignModal
      }
    }>
        {children}
    </GlobalContext.Provider>
}