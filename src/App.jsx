import {  useEffect } from 'react';
import { DynamicRoutes } from './routes/DynamicRoutes';
import { useDispatch } from 'react-redux';
import { setLoggedInUser } from './redux/slice/LoggedInUserSlice';


const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
  let userObj = JSON.parse(localStorage.getItem("crm_user"));
  console.log("122",userObj);
  if(userObj && userObj.user){
      dispatch(setLoggedInUser(userObj.user));
  }
  }, []);
  return (
    <>
      <DynamicRoutes />
    </>
  );
};

export default App;
