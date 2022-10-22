const path = require('path');
const os = require ('os')
const fs= require ('fs')
const { app, BrowserWindow, Menu, ipcMain,shell} = require('electron');
const resizeImg = require ('resize-img')
const isDev = process.env.NODE_ENV !== 'production'
const isMac= process.platform ==='darwin'

let mainWindow;

//Create the mainWindow
function createMainWindow(){
        mainWindow = new BrowserWindow({
        title:'Image Resizer',
        width: isDev ? 1000 : 500,
        height:600,
        webPreferences:{
            contextIsolation:true,
            nodeIntegration:true,
            preload:path.join(__dirname,'preload.js')
        }
    });



    //Open devtools if in dev env

    if(isDev){
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname,'./renderer/index.html'));
}

//Create About Window

function createAboutWindow(){
    const aboutWindow = new BrowserWindow({
        title:'About Image Resizer',
        width: 300,
        height:300
    });

    aboutWindow.loadFile(path.join(__dirname,'./renderer/about.html'));

}

//Create menu
const menu =[
    {
        label: 'File',
        submenu:[
        {
            label: "Quit",
            click: ()=>app.quit(),
            accelerator:'CmdOrCtrl+W'
        },
        {role: 'fileMenu'},
        {
            label:'about',
            click:createAboutWindow
        }

        ]
    }
]

//App is ready
app.whenReady().then(()=> {
    createMainWindow();


    //Implement Menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu)

    mainWindow.on('closed',()=>(mainWindow=null))

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
      });
    
})

//Respond to ipcRenderer resize
ipcMain.on('image:resize',(e,options)=> {
    options.dest=path.join(os.homedir(),'imageresizer')
    resizeImage(options)
})

//Resize the image

async function resizeImage({imgPath,width,height,dest}){
    try {
        const newPath=await resizeImg(fs.readFileSync(imgPath),{
            width:+width,
            height:+height
        });
        const filename = path.basename(imgPath);

        //Create dest folder if not exist
        if (!fs.existsSync(dest)){
            fs.mkdirSync(dest)
        }
        //Write file to dest
        fs.writeFileSync(path.join(dest,filename),newPath)

        //Send success
        mainWindow.webContents.send('image:done')

        //Open dest folder
        shell.openPath(dest)
    } catch (error) {
        
    }

}

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});