# ZK_AI_Meme
 ``` mermaid
flowchart TB
    subgraph AI_Agents["Scientific AI Meme Generators"]
        direction TB
        MA[Mathematics Agent]
        CA[Chemistry Agent]
        PA[Physics Agent]
        BA[Biology Agent]
        ME[Medical Agent]
        
        style MA fill:#f9f,stroke:#333
        style CA fill:#f9f,stroke:#333
        style PA fill:#f9f,stroke:#333
        style BA fill:#f9f,stroke:#333
        style ME fill:#f9f,stroke:#333
        
        subgraph Math_Domains
            MA -->|Generate| M1[Algebra Memes]
            MA -->|Generate| M2[Calculus Memes]
            MA -->|Generate| M3[Statistics Memes]
        end
        
        subgraph Science_Domains
            CA -->|Generate| C1[Organic Chemistry]
            CA -->|Generate| C2[Inorganic Chemistry]
            PA -->|Generate| P1[Quantum Physics]
            PA -->|Generate| P2[Classical Physics]
            BA -->|Generate| B1[Molecular Biology]
            BA -->|Generate| B2[Genetics]
        end
        
        subgraph Medical_Domains
            ME -->|Generate| MD1[Anatomy]
            ME -->|Generate| MD2[Pathology]
            ME -->|Generate| MD3[Pharmacology]
        end
    end

    subgraph ZKP["zkverifier.io Service"]
        direction TB
        style ZKP fill:#bbf,stroke:#333
        P[Proof Generator]
        V[Verification Oracle]
        Math_Domains & Science_Domains & Medical_Domains -->|Submit Meme| P
        P -->|Generate ZK Proof| V
        V -->|Verify AI Origin| VP[Verified Memes Pool]
        
        note[zkverifier.io]
        style note fill:#bbf,stroke:#333
    end

    subgraph Blockchain_Deployment
        BC[EDU Chain]
        style BC fill:#bfb,stroke:#333
        SC[Smart Contract]
        T[ERC20 Tokens]
        VP -->|Deploy to Chain| BC
        BC -->|Create Contract| SC
        SC -->|Mint| T
    end

    subgraph Marketplace
        MP[Marketplace]
        style MP fill:#ffb,stroke:#333
        U[Users]
        T -->|List by Subject| MP
        U -->|Purchase Memes| MP
    end

    QC[Quality Control]
    style QC fill:#fbb,stroke:#333
    QC -->|Monitor Content Accuracy| AI_Agents
```
 ![zokrates compiled](https://github.com/prateushsharma/ZK_AI_Meme/blob/main/photos/zokrates%20circuit.png)
 ![zokrates proof generated](https://github.com/prateushsharma/ZK_AI_Meme/blob/main/photos/zokrate%20proof%20generated.png)
 ![zokrates setup](https://github.com/prateushsharma/ZK_AI_Meme/blob/main/photos/zokrates%20setup.png)

