import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Import Mantine core styles
import "@mantine/core/styles.css";

// Import Mantine provider from the core
import { MantineProvider } from "@mantine/core";


import Home from '@/screens/home'

import '@/index.css'

const paths =[
  {
    path: '/',
    element: <Home />
  }
]

const browserRouter = createBrowserRouter(paths);

const App=()=>{
    return(
        <MantineProvider>
            <RouterProvider router={browserRouter}/>
        </MantineProvider>
    )
}

export default App;