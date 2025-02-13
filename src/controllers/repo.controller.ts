import { InternalServerError } from "@errors/InternalServerError";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import NodeCache from "node-cache";
// import fetch from "node-fetch";
import { number } from "zod";

const GITHUB_API = "https://api.github.com/repos";
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // Cache for 10 mins
interface Contributor {
    login: string;
    avatar_url: string;
    contributions: number;
    html_url: string;
  }
  
  interface RepoData {
    stars: number;
    forks: number;
    linesOfCode: number;
    contributors: Contributor[];
  }
// Function to fetch GitHub Repo Data
const fetchRepoData = async (owner: string, repo: string): Promise<RepoData | null> => {
    try {
      const repoRes = await axios.get(`${GITHUB_API}/${owner}/${repo}`);
      const repoData =  repoRes.data;
  
      const contributorsRes = await axios.get(`${GITHUB_API}/${owner}/${repo}/contributors?per_page=4`);
      const contributorsData =  contributorsRes.data;
  
      const langRes = await axios.get(`${GITHUB_API}/${owner}/${repo}/languages`);
      const languages = await langRes.data;
    //   @ts-ignore
      const linesOfCode = Object.values(languages).reduce((acc, val) => acc + val, 0);
    
      return {
        //@ts-ignore
        stars: repoData.stargazers_count,
        //@ts-ignore
        forks: repoData.forks_count,

        linesOfCode:linesOfCode as number,
        //@ts-ignore
        contributors: contributorsData.map((c: any) => ({
          login: c.login,
          avatar_url: c.avatar_url,
          contributions: c.contributions,
          html_url: c.html_url,
        })),
      };
    } catch (error) {
      console.error("GitHub API Error:", error);
      return null;
    }
  };
  export const getRepoStats = async(req:Request,res:Response,next:NextFunction)=>{
    try {
        // const { owner, repo } = req.params;
        const owner = "memkgupta";
        const repo = "campus_connect";
  const cacheKey = `${owner}/${repo}`;

  // Check Cache
  const cachedData = cache.get<RepoData>(cacheKey);
  if (cachedData) {
    console.log("Serving from cache");
    res.json(cachedData);
    return;
  }

  // Fetch from GitHub API
  const data = await fetchRepoData(owner, repo);
  if (data) {
    cache.set(cacheKey, data); // Store in cache
    console.log("Fetching from API and caching");
  }

  res.json(data || { error: "Failed to fetch repo data" });
    } catch (error) {
        console.log(error)
        return next(new InternalServerError("Some error occured"))
    }
  }