import {createContext,useContext,useState} from 'react';
export const AdminWorkspaceContext=createContext(null);
export function usePageFind(){const context=useContext(AdminWorkspaceContext);const [query,setQuery]=useState('');return context?[context.query,context.setQuery,true]:[query,setQuery,false];}
