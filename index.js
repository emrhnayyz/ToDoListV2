import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"todo_list",
    password:"12345",
    port:5432
});
db.connect();

app.get("/", async(req,res) =>{
try {
    const result = await db.query("SELECT * FROM tasks ORDER BY task_id ASC");
    res.render("index.ejs",{
        tasks:result.rows
    });    
} catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
    
}
})

app.post("/delete/:id", async(req,res)=>{
    const taskId = req.params.id

    try {
        await db.query("DELETE FROM tasks WHERE task_id = $1", {taskId});
        res.redirect("/")
    } catch (error) {
        console.log("Görev Silme Hatasi", error);
        res.status(500).send("Sunucu Hatasi: Görev silinemedi.");
        
    }
})

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));



app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
    
});