import {
  Box,
  Collapse,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
} from "@mui/material"
import { BeigePaper } from "components/common/BeigePaper"
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage"
import { useEffect, useState } from "react"
import { useStorage } from "reactfire"
import DeleteIcon from "@mui/icons-material/Delete"
import Image from "next/image"
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"

interface TabPanelProps {
  index: number
  value: number
}

export function FirstTabPanel({ value, index }: TabPanelProps) {
  const [storageContent, setStorageContent] = useState({})
  const [fileOpen, setFileOpen] = useState(null)
  const [fileURL, setFileURL] = useState(null)
  const [folderOpen, setFolderOpen] = useState(null)
  const [folderName, setFolderName] = useState(null)
  const storage = useStorage()

  async function getStorageContent() {
    try {
      const storageRef = ref(storage, "")
      const res = await listAll(storageRef)
      const storageObject = res.prefixes.reduce((acc, item) => {
        acc[item.name] = []
        return acc
      }, {})
      await Promise.all(
        res.prefixes.map(async (folder) => {
          const folderContent = await listAll(folder)
          const namesArray = folderContent.items.map((item) => item.name)
          storageObject[folder.name] = namesArray
        })
      )
      return storageObject
    } catch (error) {
      console.log(error)
    }
  }

  const fetchData = async () => {
    try {
      const data = await getStorageContent()
      setStorageContent(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [storage])

  const handleFolderClick = (index) => {
    if (folderOpen === index) {
      setFolderOpen(null)
    } else {
      setFolderOpen(index)
    }
  }

  const handleFileClick = async (path, index) => {
    try {
      const imageRef = ref(storage, path)
      const url = await getDownloadURL(imageRef)
      if (fileOpen === index) {
        setFileOpen(null)
        setFileURL(null)
      } else {
        setFileOpen(path)
        setFileURL(url)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const deleteImage = async (folder, file) => {
    const imageRef = ref(storage, `/${folder}/${file}`)
    try {
      await deleteObject(imageRef)
      fetchData()
      if (storageContent[folder].length === 1) {
        setFolderOpen(null)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const addImage = async (e, folder) => {
    const files = e.target.files
    const filesNames = Object.keys(files).map((key) => files[key].name)
    try {
      await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Array.from(files).map(async (file: any) => {
          const imageRef = ref(storage, `${folder}/${file.name}`)
          uploadBytes(imageRef, file)
        })
      )
      setStorageContent((prev) => {
        const newContent = { ...prev }
        newContent[folder] = [...newContent[folder], ...filesNames]
        return newContent
      })
    } catch (error) {
      console.log(error)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setStorageContent((prev) => ({
        [folderName]: [],
        ...prev,
      }))
      setFolderName(null)
    } else if (e.key === "Escape") {
      setFolderName(null)
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [folderName])

  return (
    <Stack role="tabpanel">
      {value === index && (
        <Stack direction="row" height="100%" spacing={8} alignItems="center">
          <Stack height="100%">
            <List component="div" disablePadding sx={{ bgcolor: "#f7faf2" }}>
              <ListItem
                sx={{ py: 3 }}
                secondaryAction={
                  <Stack direction="row" alignItems="center">
                    <ListItemText primary="Dodaj folder" />
                    <IconButton>
                      <AddCircleOutlineIcon
                        onClick={() => setFolderName("nowy folder")}
                      />
                    </IconButton>
                  </Stack>
                }
              />
            </List>
            <List sx={{ width: "20rem", bgcolor: "#f7faf2" }} component="nav">
              {folderName != null ? (
                <ListItem>
                  <Input
                    placeholder={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                  />
                </ListItem>
              ) : null}
              {Object.keys(storageContent)
                .sort()
                .map((folder, folderIndex) => (
                  <Stack>
                    <ListItemButton
                      onClick={() => handleFolderClick(folderIndex)}
                    >
                      <ListItemText primary={folder} />
                    </ListItemButton>
                    <Collapse
                      in={folderIndex == folderOpen}
                      timeout="auto"
                      unmountOnExit
                    >
                      <List component="div" disablePadding>
                        <ListItem
                          sx={{ py: 2 }}
                          secondaryAction={
                            <Stack direction="row" alignItems="center">
                              <ListItemText primary="Dodaj zdjęcia" />
                              <input
                                accept="image/*"
                                style={{ display: "none" }}
                                id="add-file-button"
                                type="file"
                                onChange={(e) => addImage(e, folder)}
                                multiple
                              />
                              <label htmlFor="add-file-button">
                                <IconButton component="span">
                                  <AddCircleOutlineIcon />
                                </IconButton>
                              </label>
                            </Stack>
                          }
                        />
                      </List>
                    </Collapse>
                    {storageContent[folder].map((file, fileIndex) => (
                      <Collapse
                        in={folderIndex == folderOpen}
                        timeout="auto"
                        unmountOnExit
                        key={fileIndex}
                        sx={{ overflowY: "scroll" }}
                      >
                        <List component="div" disablePadding>
                          <ListItem
                            sx={{
                              borderBottom:
                                `/${folder}/${file}` == fileOpen
                                  ? "1px solid #cbcaab"
                                  : null,
                              borderTop:
                                `/${folder}/${file}` == fileOpen
                                  ? "1px solid #cbcaab"
                                  : null,
                            }}
                            secondaryAction={
                              <IconButton>
                                <DeleteIcon
                                  onClick={() => deleteImage(folder, file)}
                                />
                              </IconButton>
                            }
                          >
                            <ListItemButton
                              sx={{ pl: 4 }}
                              onClick={() =>
                                handleFileClick(`/${folder}/${file}`, fileIndex)
                              }
                            >
                              <ListItemText primary={file} />
                            </ListItemButton>
                          </ListItem>
                        </List>
                      </Collapse>
                    ))}
                  </Stack>
                ))}
            </List>
          </Stack>
          {fileOpen != null ? (
            <Box position="relative" height="100%">
              <Box height="30rem" width="30rem" position="fixed">
                <BeigePaper>
                  <Image
                    src={fileURL}
                    layout="fill"
                    objectFit="contain"
                    style={{
                      borderRadius: "0.5rem",
                      transform: "scale(0.9)",
                    }}
                    priority
                    alt="animal image"
                  />
                </BeigePaper>
              </Box>
            </Box>
          ) : null}
        </Stack>
      )}
    </Stack>
  )
}
